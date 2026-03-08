import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Lock,
  Bell,
  Shield,
  Eye,
  MapPin,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  authApi,
  privacyApi,
  PrivacySettingsResponse,
  UpdatePrivacySettingsRequest,
  usersApi,
} from '@/lib/api';
import { toast, getActionableErrorMessage } from '@/lib/toast';
import { ConfirmAccountActionDialog } from './ConfirmAccountActionDialog';
import { PasswordChangeCard } from '@/components/PasswordChangeCard';
import { performLogoutRedirect } from '@/lib/authRedirect';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'account' | 'privacy' | 'notifications' | 'security'
  >('account');
  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsResponse | null>(null);
  const [privacyLoading, setPrivacyLoading] = useState(true);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  useEffect(() => {
    privacyApi
      .getSettings()
      .then((data) => {
        setPrivacySettings(data);
        setPrivacyLoading(false);
      })
      .catch((err) => {
        setPrivacyError(err.message || 'Failed to load privacy settings');
        setPrivacyLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account and privacy preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'account'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Account</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'privacy'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Eye className="w-5 h-5" />
              <span>Privacy</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'security'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Security & Safety</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'account' && <AccountSettings user={user} />}
            {activeTab === 'privacy' && <PrivacySettings initialSettings={privacySettings} initialLoading={privacyLoading} initialError={privacyError} onSettingsChange={setPrivacySettings} />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'security' && <SecuritySettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountSettings({ user }: { user: any }) {
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Account Information</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-gray-700 mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              defaultValue={user?.displayName || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              defaultValue={user?.email || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              defaultValue={user?.phone || ''}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-gray-700 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="location"
                type="text"
                defaultValue={user?.location || ''}
                placeholder="Enter your location"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              defaultValue={user?.bio || ''}
              placeholder="Tell others about yourself..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-3">
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Default Preferences</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="defaultIntensity" className="block text-gray-700 mb-2">
              Default Intensity
            </label>
            <select
              id="defaultIntensity"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option>Low - Casual & Social</option>
              <option>Medium - Competitive</option>
              <option>High - Very Competitive</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

// Maps between display labels and backend codes
const PROFILE_VISIBILITY_MAP: Record<string, string> = {
  Public: 'public',
  'Friends Only': 'friends',
  Private: 'private',
};

function codeToLabel(map: Record<string, string>, code: string): string {
  const entry = Object.entries(map).find(([, v]) => v === code);
  return entry ? entry[0] : Object.keys(map)[0];
}

const SKILLS_VISIBILITY_MAP: Record<string, string> = {
  Public: 'public',
  'Friends Only': 'friends',
  'Participants Only': 'participants',
  Private: 'private',
};

const HISTORY_VISIBILITY_MAP: Record<string, string> = {
  Public: 'public',
  'Friends Only': 'friends',
  Private: 'private',
};

const MEDIA_VISIBILITY_MAP: Record<string, string> = {
  Public: 'public',
  Friends: 'friends',
  Participants: 'participants',
  Private: 'private',
};

const LOCATION_RULE_MAP: Record<string, string> = {
  Always: 'always_visible',
  'After Accepted': 'confirmed_only',
  'After Check-in': 'approximate',
  Never: 'hidden',
};

function PrivacySettings({
  initialSettings,
  initialLoading,
  initialError,
  onSettingsChange,
}: Readonly<{
  initialSettings: PrivacySettingsResponse | null;
  initialLoading: boolean;
  initialError: string | null;
  onSettingsChange: (settings: PrivacySettingsResponse | null) => void;
}>) {
  const settings = initialSettings;
  const isLoading = initialLoading;
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  const handleUpdate = useCallback(
    async (update: UpdatePrivacySettingsRequest) => {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);
      try {
        const updated = await privacyApi.updateSettings(update);
        onSettingsChange(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to save privacy settings';
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [onSettingsChange]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Loading privacy settings...</span>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Privacy settings saved
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-gray-900">Profile Visibility</h2>
          {isSaving && (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          )}
        </div>
        <div className="space-y-6">
          <PrivacySetting
            label="Profile Visibility"
            description="Choose who can see your personal details like bio, location, and activity history. Trust metrics (reliability score, games played, endorsements) are always visible."
            options={Object.keys(PROFILE_VISIBILITY_MAP)}
            value={codeToLabel(
              PROFILE_VISIBILITY_MAP,
              settings?.profileVisibility || 'public'
            )}
            onChange={(label) =>
              handleUpdate({
                profileVisibility: PROFILE_VISIBILITY_MAP[label],
              })
            }
          />
          <PrivacySetting
            label="Skills Visibility"
            description="Control who can see your skill ratings."
            options={Object.keys(SKILLS_VISIBILITY_MAP)}
            value={codeToLabel(
              SKILLS_VISIBILITY_MAP,
              settings?.skillsVisibility || 'public'
            )}
            onChange={(label) =>
              handleUpdate({
                skillsVisibility: SKILLS_VISIBILITY_MAP[label],
              })
            }
          />
          <PrivacySetting
            label="Game History Visibility"
            description="Control who can see your past games."
            options={Object.keys(HISTORY_VISIBILITY_MAP)}
            value={codeToLabel(
              HISTORY_VISIBILITY_MAP,
              settings?.historyVisibility || 'public'
            )}
            onChange={(label) =>
              handleUpdate({
                historyVisibility: HISTORY_VISIBILITY_MAP[label],
              })
            }
          />
          <PrivacySetting
            label="Media Default Visibility"
            description="Default visibility for uploaded photos and videos."
            options={Object.keys(MEDIA_VISIBILITY_MAP)}
            value={codeToLabel(
              MEDIA_VISIBILITY_MAP,
              settings?.mediaDefaultVisibility || 'participants'
            )}
            onChange={(label) =>
              handleUpdate({
                mediaDefaultVisibility: MEDIA_VISIBILITY_MAP[label],
              })
            }
          />
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <ToggleSetting
            label="Allow Profile Search"
            description="Allow non-friends to find your profile in player search. Friends can always find you."
            value={settings?.allowProfileSearch ?? true}
            onChange={(enabled) =>
              handleUpdate({ allowProfileSearch: enabled })
            }
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Location Privacy</h2>
        <div className="space-y-6">
          <PrivacySetting
            label="Location Visibility"
            description="Control when others can see game locations."
            options={Object.keys(LOCATION_RULE_MAP)}
            value={codeToLabel(
              LOCATION_RULE_MAP,
              settings?.locationVisibilityRule || 'confirmed_only'
            )}
            onChange={(label) =>
              handleUpdate({
                locationVisibilityRule: LOCATION_RULE_MAP[label],
              })
            }
          />
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                For safety reasons, exact locations are only shared with accepted
                participants. You can customize this for each game.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Data & Privacy</h2>
        <div className="space-y-4">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Download className="w-5 h-5 text-gray-400" />
            <div>
              <div>Download Your Data</div>
              <div className="text-sm text-gray-600">
                Get a copy of your PlayLocal data
              </div>
            </div>
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Shield className="w-5 h-5 text-gray-400" />
            <div>
              <div>Privacy Policy</div>
              <div className="text-sm text-gray-600">
                Read our privacy policy
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

function NotificationSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl text-gray-900 mb-6">Notification Preferences</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-gray-900 mb-4">Game Notifications</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="Game Reminders"
              description="Get notified before your games start"
              value={true}
            />
            <ToggleSetting
              label="Game Updates"
              description="Notifications about changes to your games"
              value={true}
            />
            <ToggleSetting
              label="Waitlist Updates"
              description="Get notified when you move from waitlist to confirmed"
              value={true}
            />
            <ToggleSetting
              label="Team Balancing"
              description="Notifications about team assignments"
              value={true}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-gray-900 mb-4">Social Notifications</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="Friend Requests"
              description="Get notified of new friend requests"
              value={true}
            />
            <ToggleSetting
              label="Game Invites"
              description="Notifications when friends invite you to games"
              value={true}
            />
            <ToggleSetting
              label="Chat Messages"
              description="Get notified of new messages in game chats"
              value={true}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-gray-900 mb-4">Performance Notifications</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="Skill Rating Updates"
              description="Get notified when your skill ratings change"
              value={false}
            />
            <ToggleSetting
              label="Achievement Unlocked"
              description="Notifications when you earn new achievements"
              value={true}
            />
            <ToggleSetting
              label="Match Recaps"
              description="Get notified when match recaps are available"
              value={false}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-gray-900 mb-4">Email Notifications</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="Weekly Summary"
              description="Receive a weekly email with your activity summary"
              value={true}
            />
            <ToggleSetting
              label="Promotional Emails"
              description="Receive updates about new features and events"
              value={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaToggling, setMfaToggling] = useState(false);
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);

  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [accountAction, setAccountAction] = useState<'deactivate' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [redirectingAction, setRedirectingAction] = useState<
    'deactivate' | 'delete' | null
  >(null);

  useEffect(() => {
    authApi.getMfaStatus()
      .then((data) => setMfaEnabled(data.mfaEnabled))
      .catch(() => {})
      .finally(() => setMfaLoading(false));
  }, []);

  const handleMfaToggle = async () => {
    setMfaToggling(true);
    setMfaMessage(null);
    try {
      if (mfaEnabled) {
        await authApi.disableMfa();
        setMfaEnabled(false);
        setMfaMessage('MFA has been disabled.');
      } else {
        await authApi.enableMfa();
        setMfaEnabled(true);
        setMfaMessage('MFA has been enabled. You will need to verify a code on your next login.');
      }
      setTimeout(() => setMfaMessage(null), 4000);
    } catch {
      setMfaMessage('Failed to update MFA setting.');
    } finally {
      setMfaToggling(false);
    }
  };

  const handleAccountAction = async () => {
    if (!accountAction) return;

    const pendingAction = accountAction;
    setShowAccountDialog(false);
    setRedirectingAction(pendingAction);
    setIsProcessing(true);
    try {
      if (pendingAction === 'deactivate') {
        await usersApi.deactivateAccount();
        performLogoutRedirect('/', {
          message: 'Account deactivated',
          type: 'success',
        });
      } else {
        await usersApi.deleteAccount();
        performLogoutRedirect('/', {
          message: 'Account deleted',
          type: 'success',
        });
      }
    } catch (err: any) {
      setRedirectingAction(null);
      const errorMessage = getActionableErrorMessage(
        err,
        `${pendingAction} account`
      );
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setAccountAction(null);
    }
  };


  return (
    <>
      <PasswordChangeCard />

      {/* MFA Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl text-gray-900">Two-Factor Authentication</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Add an extra layer of security. When enabled, you&apos;ll receive a 6-digit verification code via email each time you log in.
        </p>
        {mfaMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            mfaMessage.includes('Failed') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}>
            {mfaMessage}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-900 mb-1">Email-based MFA</div>
            <div className="text-sm text-gray-600">
              {mfaLoading ? 'Loading...' : mfaEnabled ? 'Currently enabled' : 'Currently disabled'}
            </div>
          </div>
          <button
            onClick={handleMfaToggle}
            disabled={mfaLoading || mfaToggling}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              mfaEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
            }`}
          >
            {mfaToggling ? 'Updating...' : mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Safety & Moderation</h2>
        <div className="space-y-4">
          <ToggleSetting
            label="Require Check-in Confirmation"
            description="Require manual check-in for all games"
            value={true}
          />
          <ToggleSetting
            label="Hide Location Until Accepted"
            description="Don't show exact location until you're accepted to a game"
            value={true}
          />
          <ToggleSetting
            label="Block Anonymous Users"
            description="Only allow verified users to contact you"
            value={false}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Account Actions</h2>
        <div className="space-y-3">
          <button
            onClick={() => {
              setAccountAction('deactivate');
              setShowAccountDialog(true);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Lock className="w-5 h-5 text-gray-400" />
            <div>
              <div>Deactivate Account</div>
              <div className="text-sm text-gray-600">
                Temporarily disable your account
              </div>
            </div>
          </button>
          <button
            onClick={() => {
              setAccountAction('delete');
              setShowAccountDialog(true);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <div>
              <div>Delete Account</div>
              <div className="text-sm text-red-600">
                Permanently delete your account and all data
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Account Action Confirmation Dialog */}
      {accountAction && (
        <ConfirmAccountActionDialog
          isOpen={showAccountDialog}
          onClose={() => {
            setShowAccountDialog(false);
            setAccountAction(null);
          }}
          onConfirm={handleAccountAction}
          action={accountAction}
          isLoading={isProcessing}
        />
      )}

      {redirectingAction && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="text-gray-700">
              {redirectingAction === 'deactivate'
                ? 'Deactivating account...'
                : 'Deleting account...'}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

function PrivacySetting({
  label,
  description,
  options,
  value,
  onChange,
}: {
  label: string;
  description: string;
  options: string[];
  value: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-gray-700 mb-1">{label}</label>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange?: (value: boolean) => void;
}) {
  const [isEnabled, setIsEnabled] = useState(value);

  useEffect(() => {
    setIsEnabled(value);
  }, [value]);

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="text-gray-900 mb-1">{label}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
          isEnabled ? 'bg-emerald-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
