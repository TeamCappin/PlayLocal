'use client';

import { AuthProvider } from '@/context/AuthContext';
import { AssistantProvider } from '@/context/AssistantContext';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export function Providers({ children }: { children: React.ReactNode }) {
  const content = (
    <AuthProvider>
      <AssistantProvider>{children}</AssistantProvider>
    </AuthProvider>
  );

  if (!RECAPTCHA_SITE_KEY) return content;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      {content}
    </GoogleReCaptchaProvider>
  );
}
