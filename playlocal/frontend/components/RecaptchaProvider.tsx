'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

/** Wraps auth flows only; root `providers.tsx` stays free of reCAPTCHA. */
export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? '';
  if (!key) {
    return <>{children}</>;
  }
  return (
    <GoogleReCaptchaProvider reCaptchaKey={key}>
      {children}
    </GoogleReCaptchaProvider>
  );
}
