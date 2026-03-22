'use client';

import { AuthProvider } from '@/context/AuthContext';
import { AssistantProvider } from '@/context/AssistantContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AssistantProvider>{children}</AssistantProvider>
    </AuthProvider>
  );
}
