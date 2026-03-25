import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { INTENSITY_OPTIONS, AVAILABILITY_OPTIONS } from '@/lib/constants';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const PASSWORD_RULES = [
    { id: 'length',    label: 'At least 8 characters',         test: (p: string) => p.length >= 8 },
    { id: 'upper',     label: 'At least 1 uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
    { id: 'lower',     label: 'At least 1 lowercase letter',   test: (p: string) => /[a-z]/.test(p) },
    { id: 'number',    label: 'At least 1 number',             test: (p: string) => /\d/.test(p) },
    { id: 'special',   label: 'At least 1 special character',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
    { id: 'variety',   label: 'Not all the same character',    test: (p: string) => p.length < 2 || !/^(.)\1+$/.test(p) },
];

function validatePassword(password: string): string | null {
    for (const rule of PASSWORD_RULES) {
        if (!rule.test(password)) {
            return `Password does not meet requirements: ${rule.label.toLowerCase()}.`;
        }
    }
    return null;
}

export const RegisterPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [eulaAccepted, setEulaAccepted] = useState(false);
    const [intensity, setIntensity] = useState('');
    const [availability, setAvailability] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

  const { register, user, isLoading: authLoading } = useAuth();
  const navigate = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Redirect authenticated users to discover page
  useEffect(() => {
    if (!authLoading && user) {
      navigate.push('/discover');
    }
  }, [user, authLoading, navigate]);

  const toggleAvailability = (id: string) => {
    setAvailability((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!ageConfirmed) {
      setError('You must confirm you are at least 13 years old');
      return;
    }

    if (!eulaAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!intensity) {
      setError('Please select your play intensity');
      return;
    }

    if (availability.length === 0) {
      setError('Please select at least one availability option');
      return;
    }

    setIsLoading(true);

    try {
      const captchaToken = executeRecaptcha ? await executeRecaptcha('register') : undefined;
      await register(email, password, displayName, ageConfirmed, eulaAccepted, captchaToken);
      // TODO: Save intensity and availability to profile via API
      navigate.push('/discover');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full" style={{ maxWidth: '32rem' }}>
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8 gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            1
          </div>
          <div
            className={`w-16 h-1 ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-200'}`}
          ></div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            2
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {step === 1 ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Create Account
                </h1>
                <p className="mt-2 text-gray-600">
                  Join the PlayLocal community
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleStep1Submit} className="space-y-6">
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Your name"
                  />
                </div>

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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
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
                  className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                <ul className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                      <li
                        key={rule.id}
                        className={`flex items-center gap-2 text-xs ${
                          met ? 'text-emerald-600' : 'text-gray-400'
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

                <div className="space-y-4 pt-4">
                  <label htmlFor="age" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id = "age"
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-600">
                      I confirm that I am at least <strong>13 years old</strong>
                    </span>
                  </label>

                  <label htmlFor="terms" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id = "terms"
                      type="checkbox"
                      checked={eulaAccepted}
                      onChange={(e) => setEulaAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <a
                        href="/terms"
                        className="text-emerald-600 hover:underline"
                      >
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a
                        href="/privacy"
                        className="text-emerald-600 hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                >
                  Continue
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Tell Us About You
                </h1>
                <p className="mt-2 text-gray-600">
                  Help us match you with the right games
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleStep2Submit} className="space-y-6">
                {/* Intensity Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Self-Rated Intensity <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {INTENSITY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setIntensity(option.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            intensity === option.id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 mx-auto mb-2 ${intensity === option.id ? 'text-emerald-600' : 'text-gray-400'}`}
                          />
                          <div
                            className={`font-medium ${intensity === option.id ? 'text-emerald-700' : 'text-gray-700'}`}
                          >
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {option.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This helps other players know what to expect when playing
                    with you
                  </p>
                </div>

                {/* Availability Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Availability <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABILITY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleAvailability(option.id)}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                            availability.includes(option.id)
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${availability.includes(option.id) ? 'text-emerald-600' : 'text-gray-400'}`}
                          />
                          <span
                            className={`font-medium ${availability.includes(option.id) ? 'text-emerald-700' : 'text-gray-700'}`}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This helps other players know when you are available to play
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
          <p className="mt-4 text-center text-xs text-gray-400 sm:hidden">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" className="underline">Privacy Policy</a> and{' '}
            <a href="https://policies.google.com/terms" className="underline">Terms of Service</a> apply.
          </p>
        </div>
      </div>
    </div>
  );
};
