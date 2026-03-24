'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';

const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (p: string) => p.length >= 8,
  },
  {
    id: 'upper',
    label: 'At least 1 uppercase letter',
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: 'lower',
    label: 'At least 1 lowercase letter',
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: 'number',
    label: 'At least 1 number',
    test: (p: string) => /\d/.test(p),
  },
  {
    id: 'special',
    label: 'At least 1 special character',
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
  {
    id: 'variety',
    label: 'Not all the same character',
    test: (p: string) => p.length < 2 || !/^(.)\1+$/.test(p),
  },
];

function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      return `Password does not meet requirements: ${rule.label.toLowerCase()}.`;
    }
  }
  return null;
}

const NewPasswordClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const code = useMemo(() => searchParams.get('code') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !code) {
      setError('Invalid or missing reset link information.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({
        email,
        code,
        newPassword: password,
      });

      router.push('/login?reset=success');
    } catch (err: any) {
      setError(err?.message || 'Unable to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full" style={{ maxWidth: '32rem' }}>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Set new password</h1>
            <p className="mt-2 text-gray-600">
              Choose a new password for your account.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New password
              </label>

              <div className="relative w-full">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="w-full px-4 py-3 pr-11 border border-gray-400 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {(passwordFocused || password.length > 0) && (
                <ul className="mt-3 space-y-1.5">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                      <li
                        key={rule.id}
                        className={`flex items-center gap-2 text-xs ${
                          met ? 'text-emerald-600' : 'text-gray-500'
                        }`}
                      >
                        {met ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm new password
              </label>

              <div className="relative w-full">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                  className="w-full px-4 py-3 pr-11 border border-gray-400 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {(confirmFocused || confirmPassword.length > 0) && (
                <div className="mt-3 text-xs">
                  {passwordsMatch ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Passwords match
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      Passwords must match
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-black text-black rounded-full hover:opacity-90 transition font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Continue'}
            </button>
          </form>

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

export default NewPasswordClient;