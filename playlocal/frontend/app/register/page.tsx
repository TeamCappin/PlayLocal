'use client';

import { RegisterPage } from '@/components/RegisterPage';
import { RecaptchaProvider } from '@/components/RecaptchaProvider';

export default function Page() {
  return (
    <RecaptchaProvider>
      <RegisterPage />
    </RecaptchaProvider>
  );
}
