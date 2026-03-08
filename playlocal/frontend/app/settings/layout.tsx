'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SettingsLoading, SettingsError } from '@/components/SettingsPage';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      loadingContent={<SettingsLoading />}
      errorContent={(error, retry) => (
        <SettingsError message={error} onRetry={retry} />
      )}
    >
      {children}
    </ProtectedRoute>
  );
}
