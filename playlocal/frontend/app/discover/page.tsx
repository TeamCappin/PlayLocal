'use client';

import { Suspense } from 'react';
import { GameDiscovery } from '@/components/GameDiscovery';

function DiscoverFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse text-gray-500">Loading discover...</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<DiscoverFallback />}>
      <GameDiscovery />
    </Suspense>
  );
}
