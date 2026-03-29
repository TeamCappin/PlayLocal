'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useGoogleReCaptcha } from '@/hooks/useGoogleReCaptcha';

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const captchaToken = executeRecaptcha ? await executeRecaptcha('forgot_password') : undefined;
      await authApi.forgotPassword({ email, captchaToken });
    } catch {
      // Generic response for security
    } finally {
      setIsLoading(false);
      setSubmitted(true);

      setTimeout(() => {
        router.push(
          `/reset-password/validate?email=${encodeURIComponent(email)}`
        );
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full" style={{ maxWidth: '32rem' }}>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Reset password</h1>
            <p className="mt-2 text-gray-600">
              Enter your email to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">
              If an account exists, a reset link/code has been sent.
            </div>
          ) : (
            <form onSubmit={handleContinue} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-3.5 bg-black text-black rounded-full hover:opacity-90 transition font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Continue'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Back to login
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-500">
            <Link href="/terms-of-service" className="underline hover:text-gray-700">
              Terms of Use
            </Link>
            <span>|</span>
            <Link href="/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;