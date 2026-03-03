import { useState } from 'react';
import {
  User,
  Lock,
  Bell,
  Shield,
  Eye,
  MapPin,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'account' | 'privacy' | 'notifications' | 'security'
  >('account');

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
            {activeTab === 'privacy' && <PrivacySettings />}
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
            <label className="block text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              defaultValue={user?.displayName || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue={user?.email || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              defaultValue={user?.phone || ''}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                defaultValue={user?.location || ''}
                placeholder="Enter your location"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Bio</label>
            <textarea
              rows={4}
              defaultValue={user?.bio || ''}
              placeholder="Tell others about yourself..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            ></textarea>
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
            <label className="block text-gray-700 mb-2">
              Default Intensity
            </label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
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

function PrivacySettings() {
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Profile Visibility</h2>
        <div className="space-y-6">
          <PrivacySetting
            label="Profile Visibility"
            description="Control who can see your profile"
            options={['Public', 'Friends Only', 'Private']}
            defaultValue="Public"
          />
          <PrivacySetting
            label="Skills Visibility"
            description="Control who can see your skill ratings"
            options={['Public', 'Friends Only', 'Participants Only', 'Private']}
            defaultValue="Public"
          />
          <PrivacySetting
            label="Game History Visibility"
            description="Control who can see your past games"
            options={['Public', 'Friends Only', 'Private']}
            defaultValue="Friends Only"
          />
          <PrivacySetting
            label="Media Default Visibility"
            description="Default visibility for uploaded photos and videos"
            options={['Public', 'Friends', 'Participants', 'Private']}
            defaultValue="Participants"
          />
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <ToggleSetting
            label="Allow Profile Search"
            description="Allow others to find your profile in player search"
            defaultValue={true}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Location Privacy</h2>
        <div className="space-y-6">
          <PrivacySetting
            label="Location Visibility"
            description="Control when others can see game locations"
            options={['Always', 'After Accepted', 'After Check-in', 'Never']}
            defaultValue="After Accepted"
          />
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                For safety reasons, exact locations are only shared with
                accepted participants. You can customize this for each game.
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
              defaultValue={true}
            />
            <ToggleSetting
              label="Game Updates"
              description="Notifications about changes to your games"
              defaultValue={true}
            />
            <ToggleSetting
              label="Waitlist Updates"
              description="Get notified when you move from waitlist to confirmed"
              defaultValue={true}
            />
            <ToggleSetting
              label="Team Balancing"
              description="Notifications about team assignments"
              defaultValue={true}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-gray-900 mb-4">Social Notifications</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="Friend Requests"
              description="Get notified of new friend requests"
              defaultValue={true}
            />
            <ToggleSetting
              label="Game Invites"
              description="Notifications when friends invite you to games"
              defaultValue={true}
            />
            <ToggleSetting
              label="Chat Messages"
              description="Get notified of new messages in game chats"
              defaultValue={true}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-gray-900 mb-4">Performance Notifications</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="Skill Rating Updates"
              description="Get notified when your skill ratings change"
              defaultValue={false}
            />
            <ToggleSetting
              label="Achievement Unlocked"
              description="Notifications when you earn new achievements"
              defaultValue={true}
            />
            <ToggleSetting
              label="Match Recaps"
              description="Get notified when match recaps are available"
              defaultValue={false}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-gray-900 mb-4">Email Notifications</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="Weekly Summary"
              description="Receive a weekly email with your activity summary"
              defaultValue={true}
            />
            <ToggleSetting
              label="Promotional Emails"
              description="Receive updates about new features and events"
              defaultValue={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Password & Security</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Update Password
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Safety & Moderation</h2>
        <div className="space-y-4">
          <ToggleSetting
            label="Require Check-in Confirmation"
            description="Require manual check-in for all games"
            defaultValue={true}
          />
          <ToggleSetting
            label="Hide Location Until Accepted"
            description="Don't show exact location until you're accepted to a game"
            defaultValue={true}
          />
          <ToggleSetting
            label="Block Anonymous Users"
            description="Only allow verified users to contact you"
            defaultValue={false}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl text-gray-900 mb-6">Account Actions</h2>
        <div className="space-y-3">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Lock className="w-5 h-5 text-gray-400" />
            <div>
              <div>Deactivate Account</div>
              <div className="text-sm text-gray-600">
                Temporarily disable your account
              </div>
            </div>
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
    </>
  );
}

function PrivacySetting({
  label,
  description,
  options,
  defaultValue,
}: {
  label: string;
  description: string;
  options: string[];
  defaultValue: string;
}) {
  return (
    <div>
      <label className="block text-gray-700 mb-1">{label}</label>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <select
        defaultValue={defaultValue}
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
  defaultValue,
}: {
  label: string;
  description: string;
  defaultValue: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(defaultValue);

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="text-gray-900 mb-1">{label}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
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
