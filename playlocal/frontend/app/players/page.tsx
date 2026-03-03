'use client';

import { PlayerSearch } from '@/components/PlayerSearch';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <PlayerSearch />
    </ProtectedRoute>
  );
}
