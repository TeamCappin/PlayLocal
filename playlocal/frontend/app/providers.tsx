'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { consumeRedirectToast } from '@/lib/authRedirect';
import { toast } from '@/lib/toast';

function RedirectToastBootstrap() {
  useEffect(() => {
    const payload = consumeRedirectToast();
    if (!payload) {
      return;
    }

    toast[payload.type](payload.message);
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RedirectToastBootstrap />
      {children}
    </AuthProvider>
  );
}
