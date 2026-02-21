import React from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

interface GameMapPin {
  id: string;
  title: string;
  lat?: number;
  lng?: number;
  sport: string;
  time: string;
  date: string;
  distance: string;
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

  if (games.length === 0 || mappableGames.length === 0) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl text-gray-700 mb-2">No games on the map</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId="playlocal-discover-map"
        >
          {mappableGames.map((game) => (
            <AdvancedMarker
              key={game.id}
              position={{ lat: game.lat, lng: game.lng }}
              title={`${game.sport} \u2013 ${game.date} at ${game.time}`}
            >
              <div className="bg-emerald-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md border-2 border-white whitespace-nowrap max-w-[160px] truncate">
                {game.title}
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
