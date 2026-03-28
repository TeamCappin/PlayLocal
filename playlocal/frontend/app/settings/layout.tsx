'use client';

import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SettingsLoading, SettingsError } from '@/components/SettingsPage';

/** Top-level render fn so we don’t define a component inside `SettingsLayout` (Sonar). */
function renderSettingsErrorContent(error: string, retry: () => void) {
  return <SettingsError message={error} onRetry={retry} />;
}

export default function SettingsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ProtectedRoute
      loadingContent={<SettingsLoading />}
      errorContent={renderSettingsErrorContent}
    >
      {children}
    </ProtectedRoute>
  );
}
