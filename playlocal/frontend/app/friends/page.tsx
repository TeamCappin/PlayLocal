'use client';

import { FriendsPage } from '@/components/FriendsPage';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <FriendsPage />
    </ProtectedRoute>
  );
}
