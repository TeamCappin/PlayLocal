import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  CollisionBehavior,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { MapPin, Clock, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';

interface GameMapPin {
  id: string;
  title: string;
  lat?: number;
  lng?: number;
  sport: string;
  time: string;
  date: string;
  locationArea?: string;
  location: string;
  /** If lat/lng are missing, geocode this (e.g. city from the card's "Near …" text). */
  approximateMapQuery?: string;
  /** Optional distance field — present when sourced from GameDisplay but not used by MapView. */
  distance?: string;
}

type ResolvedMapPin = GameMapPin & {
  lat: number;
  lng: number;
  isApproximate: boolean;
};

/** Grouping key: pins within this bucket share one spread layout. */
const COORD_KEY_DECIMALS = 4;

/** Golden angle (phyllotaxis) — fills space in a loose spiral, not a ring. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

type PinToRender = ResolvedMapPin & { displayLat: number; displayLng: number };

/** Stable 0..1 from string (same input → same output every render). */
function stableUnit(id: string, salt: number): number {
  let h = salt >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(31, h) + id.charCodeAt(i);
  }
  return (Math.abs(h) % 10_007) / 10_007;
}

/**
 * Scales pin offsets in meters vs map zoom. Uses **live** camera zoom when available:
 * zoomed out → larger spread in meters; zoomed in → smaller spread (cluster tightens
 * toward the real centroid so pins aren’t pushed into water / wrong neighborhoods).
 * Roughly tracks Mercator “same on-screen spacing”: ~2× meters per zoom level out from REF.
 */
const APPROX_SPREAD_BASE = 2.14;
const APPROX_REF_ZOOM = 13.1;

function zoomSpreadMultiplier(mapZoom: number, clusterIsApproximateOnly: boolean): number {
  if (!clusterIsApproximateOnly) {
    const raw = Math.pow(1.2, 11.5 - mapZoom);
    return Math.min(2.0, Math.max(0.32, raw));
  }
  const raw = Math.pow(APPROX_SPREAD_BASE, APPROX_REF_ZOOM - mapZoom);
  /* Higher floor = a bit more screen space between pins when the cluster is tight (zoomed in). */
  return Math.min(20, Math.max(0.34, raw));
}

/**
 * Fan out stacked markers using a golden-angle spiral + mild jitter and ellipse,
 * so clusters look organic instead of a perfect circle.
 */
function spreadOverlappingPins(
  pins: ResolvedMapPin[],
  mapZoom: number
): PinToRender[] {
  const groups: Record<string, ResolvedMapPin[]> = {};
  for (const p of pins) {
    const key = `${p.lat.toFixed(COORD_KEY_DECIMALS)},${p.lng.toFixed(COORD_KEY_DECIMALS)}`;
    const list = groups[key];
    if (list) list.push(p);
    else groups[key] = [p];
  }

  const out: PinToRender[] = [];
  for (const group of Object.values(groups)) {
    group.sort((a: ResolvedMapPin, b: ResolvedMapPin) =>
      a.id.localeCompare(b.id)
    );
    const n = group.length;
    const lat0 = group[0].lat;
    const lng0 = group[0].lng;
    const cosLat = Math.cos((lat0 * Math.PI) / 180);

    if (n === 1) {
      out.push({ ...group[0], displayLat: lat0, displayLng: lng0 });
      continue;
    }

    const approxOnly = group.every((p) => p.isApproximate);
    const zoomMul = zoomSpreadMultiplier(mapZoom, approxOnly);

    const groupSeed = stableUnit(group[0].id, 5407);
    const ellipseN = 1.12 + groupSeed * 0.55;
    const ellipseE = 1.05 + (1 - groupSeed) * 0.48;
    const rotation = (groupSeed - 0.5) * 0.55;

    const baseM =
      Math.max(118, 50 * Math.sqrt(n)) * zoomMul * (approxOnly ? 1.35 : 1);

    const radiusPow = approxOnly ? 0.76 : 0.62;

    for (let i = 0; i < n; i++) {
      const pin = group[i];
      const uA = stableUnit(pin.id, i + 11);
      const uR = stableUnit(pin.id, i + 97);

      const angle =
        i * GOLDEN_ANGLE +
        rotation +
        (uA - 0.5) * 0.65 +
        Math.sin(i * 1.7) * 0.18;

      const radiusM =
        baseM *
        Math.pow(i + 1, radiusPow) *
        (0.86 + uR * 0.62);

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const eastM = radiusM * sinA * ellipseE;
      const northM = radiusM * cosA * ellipseN;

      const dLat = northM / 111_320;
      const dLng = eastM / (111_320 * Math.max(0.2, cosLat));

      out.push({
        ...pin,
        displayLat: lat0 + dLat,
        displayLng: lng0 + dLng,
      });
    }
  }
  return out;
}

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  games?: GameMapPin[];
}

export default function MapView({
  center = { lat: 45.5017, lng: -73.5673 },
  /** Default a bit zoomed out so stacked approximate pins have room. */
  zoom = 10,
  games = [],
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const apiKeyValid = Boolean(apiKey && apiKey !== 'YOUR_API_KEY_HERE');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Smoothed zoom (eased toward camera) so pin spread doesn’t snap/bounce each event. */
  const [spreadZoom, setSpreadZoom] = useState(zoom);
  const targetZoomRef = useRef(zoom);
  const smoothedZoomRef = useRef(zoom);
  const spreadRafRef = useRef<number | null>(null);

  const approxCacheRef = useRef<Record<string, { lat: number; lng: number }>>(
    {}
  );
  const [approxTick, setApproxTick] = useState(0);
  const [approxGeocodeBusy, setApproxGeocodeBusy] = useState(false);
  /** After false: user saw we attempted / skipped approximate geocoding (avoids amber flash before first run). */
  const [approxGeocodePassComplete, setApproxGeocodePassComplete] =
    useState(false);

  const gamesStableKey = useMemo(
    () =>
      games
        .map(
          (g) =>
            `${g.id}\0${g.lat ?? ''}\0${g.lng ?? ''}\0${g.approximateMapQuery ?? ''}`
        )
        .join('\n'),
    [games]
  );

  useEffect(() => {
    if (!apiKeyValid) return;
    setApproxGeocodePassComplete(false);

    const pairs: Array<{ key: string; query: string }> = [];
    const seen = new Set<string>();
    for (const g of games) {
      const hasFiniteCoords =
        typeof g.lat === 'number' &&
        Number.isFinite(g.lat) &&
        typeof g.lng === 'number' &&
        Number.isFinite(g.lng);
      if (hasFiniteCoords) continue;
      const raw = g.approximateMapQuery?.trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ key, query: raw });
    }

    const missing = pairs.filter((p) => approxCacheRef.current[p.key] == null);
    if (missing.length === 0) {
      setApproxGeocodeBusy(false);
      setApproxGeocodePassComplete(true);
      return;
    }

    let cancelled = false;
    setApproxGeocodeBusy(true);

    void (async () => {
      try {
        for (const { key, query } of missing) {
          if (cancelled) break;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (
              cancelled ||
              !data?.[0]?.lat ||
              data[0].lon == null ||
              data[0].lon === ''
            ) {
              continue;
            }
            const lat = parseFloat(String(data[0].lat));
            const lng = parseFloat(String(data[0].lon));
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            approxCacheRef.current = {
              ...approxCacheRef.current,
              [key]: { lat, lng },
            };
            if (!cancelled) {
              setApproxTick((t) => t + 1);
            }
          } catch {
            /* ignore */
          }
          await new Promise((r) => setTimeout(r, 400));
        }
      } finally {
        if (!cancelled) {
          setApproxGeocodeBusy(false);
          setApproxGeocodePassComplete(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  // gamesStableKey encodes every field read in this effect, so depending on the
  // stable key avoids reruns from parent array identity churn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamesStableKey, apiKeyValid]);

  useEffect(() => {
    targetZoomRef.current = zoom;
    smoothedZoomRef.current = zoom;
    setSpreadZoom(zoom);
  }, [zoom]);

  const stepSpreadZoom = useCallback(function stepSpreadZoomImpl() {
    const target = targetZoomRef.current;
    let s = smoothedZoomRef.current;
    const SMOOTH = 0.12;
    s += (target - s) * SMOOTH;
    if (Math.abs(target - s) < 0.003) s = target;
    smoothedZoomRef.current = s;
    setSpreadZoom(s);
    if (Math.abs(target - s) > 0.002) {
      spreadRafRef.current = requestAnimationFrame(stepSpreadZoomImpl);
    } else {
      spreadRafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (spreadRafRef.current != null) {
        cancelAnimationFrame(spreadRafRef.current);
        spreadRafRef.current = null;
      }
    };
  }, []);

  const pinsOnMap: ResolvedMapPin[] = useMemo(() => {
    const list: ResolvedMapPin[] = [];
    for (const g of games) {
      if (
        g.lat != null &&
        g.lng != null &&
        Number.isFinite(g.lat) &&
        Number.isFinite(g.lng)
      ) {
        list.push({
          ...g,
          lat: g.lat,
          lng: g.lng,
          isApproximate: false,
        });
        continue;
      }
      const raw = g.approximateMapQuery?.trim();
      if (!raw) continue;
      const cached = approxCacheRef.current[raw.toLowerCase()];
      if (cached) {
        list.push({
          ...g,
          lat: cached.lat,
          lng: cached.lng,
          isApproximate: true,
        });
      }
    }
    return list;
  }, [games, approxTick]);

  const pinsForRender = useMemo(
    () => spreadOverlappingPins(pinsOnMap, spreadZoom),
    [pinsOnMap, spreadZoom]
  );

  const handleCameraChanged = (ev: { detail: { zoom: number } }) => {
    const z = ev.detail.zoom;
    if (!Number.isFinite(z)) return;
    targetZoomRef.current = z;
    if (spreadRafRef.current == null) {
      spreadRafRef.current = requestAnimationFrame(stepSpreadZoom);
    }
  };

  if (!apiKeyValid) {
    return (
      <div className="h-[600px] bg-gray-200 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            Google Maps API key is missing or invalid.
          </p>
          <p className="text-sm text-gray-500">
            Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.
          </p>
        </div>
      </div>
    );
  }

  const selectedGame =
    pinsForRender.find((g) => g.id === selectedId) ?? null;

  const couldApproxGeocode = games.some(
    (g) =>
      (g.lat == null || g.lng == null || !Number.isFinite(g.lat) || !Number.isFinite(g.lng)) &&
      Boolean(g.approximateMapQuery?.trim())
  );

  return (
    <div className="w-full space-y-3">
      {games.length === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <span className="text-amber-800">
            <span className="font-semibold">No games found</span> — try
            adjusting your filters or check back later.
          </span>
        </div>
      )}
      {games.length > 0 &&
        pinsOnMap.length === 0 &&
        approxGeocodeBusy &&
        couldApproxGeocode && (
          <div className="flex items-start gap-3 px-4 py-3 bg-sky-50 border border-sky-200 rounded-lg text-sm">
            <MapPin className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
            <span className="text-sky-900">
              Placing games by approximate area (not the exact address) on the
              map…
            </span>
          </div>
        )}
      {games.length > 0 &&
        pinsOnMap.length === 0 &&
        !approxGeocodeBusy &&
        (approxGeocodePassComplete || !couldApproxGeocode) && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <span className="text-amber-800">
              <span className="font-semibold">
                {games.length} game{games.length !== 1 ? 's' : ''} found
              </span>{' '}
              — none could be placed on the map. Switch to list view to see
              them.
            </span>
          </div>
        )}
      <div className="h-[600px] w-full rounded-xl overflow-hidden">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={zoom}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId="playlocal-discover-map"
            onCameraChanged={handleCameraChanged}
            onClick={() => setSelectedId(null)}
          >
            {pinsForRender.map((game) => (
              <AdvancedMarker
                key={game.id}
                position={{ lat: game.displayLat, lng: game.displayLng }}
                collisionBehavior={CollisionBehavior.REQUIRED}
                zIndex={selectedId === game.id ? 10_000 : 1}
                title={`${game.sport} \u2013 ${game.date} at ${game.time}`}
                onClick={(e) => {
                  e.stop();
                  setSelectedId(game.id);
                }}
              >
                <div
                  className={`max-w-[13rem] min-w-[2.5rem] cursor-pointer rounded-2xl border-2 border-white px-2.5 py-1.5 text-center text-[11px] font-semibold leading-snug text-white shadow-lg ring-1 ring-black/30 transition-colors [overflow-wrap:anywhere] hyphens-auto line-clamp-2 sm:text-xs ${
                    game.isApproximate
                      ? selectedId === game.id
                        ? 'bg-amber-800'
                        : 'bg-amber-600 ring-2 ring-amber-200'
                      : selectedId === game.id
                        ? 'bg-emerald-800'
                        : 'bg-emerald-700'
                  }`}
                >
                  {game.title}
                </div>
              </AdvancedMarker>
            ))}

            {selectedGame && (
              <InfoWindow
                position={{
                  lat: selectedGame.displayLat,
                  lng: selectedGame.displayLng,
                }}
                headerDisabled
                onCloseClick={() => setSelectedId(null)}
                pixelOffset={[0, -24]}
              >
                <div
                  className="box-border w-full max-w-[min(18rem,calc(100vw-2rem))] min-w-0 overflow-x-hidden px-2 pb-2 pt-1"
                >
                  <div className="flex items-start justify-between gap-2 min-w-0 mb-1">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide break-words min-w-0 flex-1 leading-tight">
                      {selectedGame.sport}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 -mr-1 -mt-0.5"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" strokeWidth={2.25} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-2 leading-snug break-words">
                    {selectedGame.title}
                  </p>
                  {selectedGame.isApproximate && (
                    <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1.5 mb-2 leading-snug break-words">
                      Approximate area only — exact location is visible after you
                      join.
                    </p>
                  )}
                  <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-1 min-w-0">
                    <Clock className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">
                      {selectedGame.date} at {selectedGame.time}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-3 min-w-0">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">
                      {selectedGame.locationArea ?? selectedGame.location}
                    </span>
                  </div>
                  <Link
                    href={`/games/${selectedGame.id}`}
                    className="flex items-center justify-center gap-1 w-full min-w-0 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <span className="truncate">View Game</span>
                    <ChevronRight className="w-3 h-3 shrink-0" />
                  </Link>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
