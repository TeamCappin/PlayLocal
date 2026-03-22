'use client';

import { SettingsPage } from '@/components/SettingsPage';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}
