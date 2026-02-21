import React from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function MapView({ center = { lat: 45.5017, lng: -73.5673 }, zoom = 11 }: MapViewProps) {
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

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        />
      </APIProvider>
    </div>
  );
}
