'use client';

import { LoginPage } from '@/components/LoginPage';
import { RecaptchaProvider } from '@/components/RecaptchaProvider';

export default function Page() {
  return (
    <RecaptchaProvider>
      <LoginPage />
    </RecaptchaProvider>
  );
}
