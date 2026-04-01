import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
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

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  games?: GameMapPin[];
}

export default function MapView({
  center = { lat: 45.5017, lng: -73.5673 },
  zoom = 11,
  games = [],
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const approxCacheRef = useRef<Record<string, { lat: number; lng: number }>>(
    {}
  );
  const [approxTick, setApproxTick] = useState(0);
  const [approxGeocodeBusy, setApproxGeocodeBusy] = useState(false);

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
    const pairs: Array<{ key: string; query: string }> = [];
    const seen = new Set<string>();
    for (const g of games) {
      if (g.lat != null && g.lng != null) continue;
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
      return;
    }

    let cancelled = false;
    setApproxGeocodeBusy(true);

    void (async () => {
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
          setApproxTick((t) => t + 1);
        } catch {
          /* ignore */
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      if (!cancelled) setApproxGeocodeBusy(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [gamesStableKey, games]);

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

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
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
    pinsOnMap.find((g) => g.id === selectedId) ?? null;

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
        !approxGeocodeBusy && (
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
            onClick={() => setSelectedId(null)}
          >
            {pinsOnMap.map((game) => (
              <AdvancedMarker
                key={game.id}
                position={{ lat: game.lat, lng: game.lng }}
                title={`${game.sport} \u2013 ${game.date} at ${game.time}`}
                onClick={(e) => {
                  e.stop();
                  setSelectedId(game.id);
                }}
              >
                <div
                  className={`text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg ring-1 ring-black/30 border-2 border-white whitespace-nowrap max-w-[160px] truncate transition-colors ${
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
                position={{ lat: selectedGame.lat, lng: selectedGame.lng }}
                onCloseClick={() => setSelectedId(null)}
                pixelOffset={[0, -36]}
              >
                <div className="w-56 p-1">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">
                    {selectedGame.sport}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mb-2 leading-snug">
                    {selectedGame.title}
                  </p>
                  {selectedGame.isApproximate && (
                    <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1 mb-2">
                      Approximate area only — exact location is visible after you
                      join.
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      {selectedGame.date} at {selectedGame.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {selectedGame.locationArea ?? selectedGame.location}
                    </span>
                  </div>
                  <Link
                    href={`/games/${selectedGame.id}`}
                    className="flex items-center justify-center gap-1 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    View Game <ChevronRight className="w-3 h-3" />
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
