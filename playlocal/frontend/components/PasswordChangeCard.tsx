import { useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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

export function PasswordChangeCard() {
  const router = useRouter();
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [newPasswordFocused, setNewPasswordFocused] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return 'All password fields are required';
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return passwordError;
    }

    if (newPassword !== confirmNewPassword) {
      return 'New password and confirmation do not match';
    }

    if (currentPassword === newPassword) {
      return 'New password must be different from current password';
    }

    return null;
  };

  const clearForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setNewPasswordFocused(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setSuccess(true);
      clearForm();

      setTimeout(async () => {
        await logout();
        router.push('/login');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl text-gray-900 mb-6">Password & Security</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Password changed successfully. Redirecting to login...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
        <label className="block text-gray-700 mb-2">Current Password</label>
        <div className="relative w-full">
            <input
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
            <button
            type="button"
            onClick={() => setShowCurrentPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            >
            {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
            ) : (
                <Eye className="h-5 w-5" />
            )}
            </button>
        </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setNewPasswordFocused(true)}
              onBlur={() => setNewPasswordFocused(false)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            >
              {showNewPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {(newPasswordFocused || newPassword.length > 0) && (
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const met = rule.test(newPassword);
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

        <div>
          <label className="block text-gray-700 mb-2">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmNewPassword ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmNewPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={
                showConfirmNewPassword
                  ? 'Hide confirm new password'
                  : 'Show confirm new password'
              }
            >
              {showConfirmNewPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}