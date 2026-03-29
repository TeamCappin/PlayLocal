'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { AssistantProvider } from '@/context/AssistantContext';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

/** Production: set NEXT_PUBLIC_RECAPTCHA_SITE_KEY. Local dev: Google’s public test key so Login/Register hooks always have a provider. */
const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ||
  '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
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
  const content = (
    <AuthProvider>
      <AssistantProvider>
        <RedirectToastBootstrap />
        {children}
      </AssistantProvider>
    </AuthProvider>
  );

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      {content}
    </GoogleReCaptchaProvider>
  );
}
