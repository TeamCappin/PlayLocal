import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
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
  /** Optional distance field — present when sourced from GameDisplay but not used by MapView. */
  distance?: string;
}

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

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return (
      <div className="h-[600px] bg-gray-200 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Google Maps API key is missing or invalid.</p>
          <p className="text-sm text-gray-500">Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.</p>
        </div>
      </div>
    );
  }

  const mappableGames = games.filter(
    (g): g is GameMapPin & { lat: number; lng: number } =>
      g.lat != null && g.lng != null
  );

  // Always render the map container for consistent layout.
  // The "no games at all" empty state is shown inside the map container below.
  if (games.length === 0) {
    return (
      <div className="relative h-[600px] w-full rounded-xl overflow-hidden">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={zoom}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId="playlocal-discover-map"
          />
        </APIProvider>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-xl">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl text-gray-700 mb-2">No games found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl text-gray-700 mb-2">No games found</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      </div>
    );
  }

  const selectedGame = mappableGames.find((g) => g.id === selectedId) ?? null;

  return (
    <div className="w-full space-y-3">
      {mappableGames.length === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <span className="text-amber-800">
            <span className="font-semibold">{games.length} game{games.length !== 1 ? 's' : ''} found</span> — none have a map location yet.
            Switch to list view to see them.
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
          {mappableGames.map((game) => (
            <AdvancedMarker
              key={game.id}
              position={{ lat: game.lat, lng: game.lng }}
              title={`${game.sport} \u2013 ${game.date} at ${game.time}`}
              onClick={(e) => { e.stop(); setSelectedId(game.id); }}
            >
              <div
                className={`text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md border-2 border-white whitespace-nowrap max-w-[160px] truncate transition-colors ${
                  selectedId === game.id ? 'bg-emerald-800' : 'bg-emerald-600'
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
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">{selectedGame.sport}</p>
                <p className="text-sm font-semibold text-gray-900 mb-2 leading-snug">{selectedGame.title}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{selectedGame.date} at {selectedGame.time}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{selectedGame.location}</span>
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
