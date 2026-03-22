'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';

const ValidateResetCodeClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Missing email information.');
      return;
    }

    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.verifyResetCode({ email, code });

      router.push(
        `/reset-password/new?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
      );
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);

    if (!email) {
      setError('Missing email information.');
      return;
    }

    setIsResending(true);

    try {
      await authApi.resendResetCode({ email });
    } catch (err: any) {
      setError(err?.message || 'Unable to resend code right now.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full" style={{ maxWidth: '32rem' }}>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Check your inbox</h1>
            <p className="mt-2 text-gray-600">
              Enter the verification code we just sent to
            </p>
            <p className="mt-1 text-gray-800 break-all">{email || 'your email'}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleContinue} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-blue-600 mb-2"
              >
                Code
              </label>

              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="w-full px-4 py-3 border-2 border-blue-400 rounded-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg tracking-[0.35em]"
                placeholder=""
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full py-3.5 bg-black text-white rounded-full hover:opacity-90 transition font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || !email}
              className="text-gray-800 hover:text-black disabled:opacity-50"
            >
              {isResending ? 'Resending...' : 'Resend email'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidateResetCodeClient;