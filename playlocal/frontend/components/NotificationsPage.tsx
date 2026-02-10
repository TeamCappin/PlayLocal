import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle, X, Calendar, Users, MessageCircle, Award, UserPlus, AlertCircle, TrendingUp, Filter, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';

// Map notification types to icons
const DISMISSED_STORAGE_KEY = "playlocal-dismissed-notifications";

function loadDismissedFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDismissedToStorage(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, React.ReactElement> = {
    GAME_REMINDER: <Calendar className="w-5 h-5 text-emerald-600" />,
    GAME_JOINED: <Users className="w-5 h-5 text-purple-600" />,
    GAME_LEFT: <Users className="w-5 h-5 text-gray-600" />,
    GAME_CANCELLED: <AlertCircle className="w-5 h-5 text-red-600" />,
    GAME_REMOVED_REQUIREMENTS: <AlertCircle className="w-5 h-5 text-amber-600" />,
    GAME_UPDATED: <Calendar className="w-5 h-5 text-emerald-600" />,
    GAME_STARTING: <Calendar className="w-5 h-5 text-amber-600" />,
    FRIEND_REQUEST: <UserPlus className="w-5 h-5 text-blue-600" />,
    MESSAGE: <MessageCircle className="w-5 h-5 text-amber-600" />,
    ACHIEVEMENT: <Award className="w-5 h-5 text-yellow-600" />,
    RATING_UPDATE: <TrendingUp className="w-5 h-5 text-emerald-600" />,
    WAITLIST_PROMOTED: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    ATTENDANCE_CONFIRMATION: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    ATTENDANCE_PROMPT: <CheckCircle className="w-5 h-5 text-emerald-600" />,
  };
  return icons[type] || <Bell className="w-5 h-5 text-gray-600" />;
};

// Mock notifications for when backend unavailable
const mockNotifications = [
  {
    notificationId: '1',
    type: 'GAME_REMINDER',
    title: 'Game starting soon',
    message: '5v5 Basketball Pickup starts in 2 hours at Parc Jarry',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    link: '/games/1',
  },
  {
    notificationId: '2',
    type: 'FRIEND_REQUEST',
    title: 'New friend request',
    message: 'Alexander El Ghaoui sent you a friend request',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false,
    link: '/friends',
  },
  {
    notificationId: '3',
    type: 'GAME_JOINED',
    title: 'Player joined your game',
    message: 'Melissa Rahman joined "Friendly Soccer Match"',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: false,
    link: '/games/2',
  },
  {
    notificationId: '4',
    type: 'MESSAGE',
    title: 'New message in game chat',
    message: 'Omar: "Should we bring our own ball?"',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    link: '/games/1',
  },
  {
    notificationId: '5',
    type: 'GAME_CANCELLED',
    title: 'Game cancelled',
    message: 'Tennis Doubles has been cancelled due to weather',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    link: '/games/5',
  },
  {
    notificationId: '6',
    type: 'ACHIEVEMENT',
    title: 'Achievement unlocked',
    message: 'You earned the "Team Player" badge',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    read: true,
    link: '/profile/me',
  },
  {
    notificationId: '7',
    type: 'RATING_UPDATE',
    title: 'Skill rating updated',
    message: 'Your Basketball rating increased to 7.2',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    read: true,
    link: '/profile/me',
  },
];

interface NotificationItem {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

export function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const { notifications: apiNotifications, unreadCount: apiUnreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [localReadState, setLocalReadState] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissedFromStorage());

  // Use API notifications only - no mock fallback
  const notifications = (apiNotifications as any) || [];

  // Combine API read state with local state
  const isRead = (notif: typeof notifications[0]) => {
    if (localReadState[notif.notificationId] !== undefined) {
      return localReadState[notif.notificationId];
    }
    return notif.read;
  };

  const filteredNotifications = notifications
    .filter((n: any) => !dismissed.has(n.notificationId))
    .filter((n: any) => filter === 'unread' ? !isRead(n) : true);

  const unreadCount = notifications.filter((n: any) => !isRead(n) && !dismissed.has(n.notificationId)).length;

  const handleMarkAsRead = async (notificationId: string) => {
    setLocalReadState(prev => ({ ...prev, [notificationId]: true }));
    try {
      await markAsRead(notificationId);
    } catch (err) {
      // Already updated locally, so don't revert
    }
  };

  const handleMarkAllAsRead = async () => {
    // Mark all locally first
    const newState: Record<string, boolean> = {};
    notifications.forEach((n: any) => { newState[n.notificationId] = true; });
    setLocalReadState(prev => ({ ...prev, ...newState }));

    try {
      await markAllAsRead();
    } catch (err) {
      // Already updated locally
    }
  };

  const handleDismiss = (notificationId: string) => {
    setDismissed(prev => {
      const next = new Set(prev).add(notificationId);
      saveDismissedToStorage(next);
      return next;
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl text-gray-900 mb-2">Sign in to view notifications</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to see your notifications.</p>
            <Link href="/login" className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-block">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="border-b border-gray-200 p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                All ({notifications.filter((n: any) => !dismissed.has(n.notificationId)).length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'unread'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="ml-3 text-gray-600">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification: any) => (
                <NotificationItem
                  key={notification.notificationId}
                  notification={notification}
                  isRead={isRead(notification)}
                  onMarkAsRead={() => handleMarkAsRead(notification.notificationId)}
                  onDismiss={() => handleDismiss(notification.notificationId)}
                  formatTime={formatTime}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No notifications to show</p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg text-gray-900 mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <NotificationToggle
              label="Game Reminders"
              description="Get notified before your games start"
              defaultEnabled={true}
            />
            <NotificationToggle
              label="Friend Requests"
              description="Notifications when someone sends you a friend request"
              defaultEnabled={true}
            />
            <NotificationToggle
              label="Game Chat Messages"
              description="Get notified of new messages in game chats"
              defaultEnabled={true}
            />
            <NotificationToggle
              label="Team Balancing Updates"
              description="Notifications about team assignments and changes"
              defaultEnabled={true}
            />
            <NotificationToggle
              label="Match Recaps"
              description="Get notified when match recaps are available"
              defaultEnabled={false}
            />
            <NotificationToggle
              label="Skill Rating Updates"
              description="Notifications when your skill ratings change"
              defaultEnabled={false}
            />
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/settings"
              className="text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              View all notification settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  isRead,
  onMarkAsRead,
  onDismiss,
  formatTime
}: {
  notification: any;
  isRead: boolean;
  onMarkAsRead: () => void;
  onDismiss: () => void;
  formatTime: (date: string) => string;
}) {
  const handleViewClick = (e: React.MouseEvent) => {
    if (!isRead) onMarkAsRead();
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors ${!isRead ? 'bg-emerald-50/30' : ''
        }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-2 rounded-full ${!isRead ? 'bg-white' : 'bg-gray-100'}`}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h4 className={`${!isRead ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isRead && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkAsRead(); }}
                  className="text-emerald-600 hover:text-emerald-700 transition-colors"
                  title="Mark as read"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{notification.createdAt ? formatTime(notification.createdAt) : ''}</span>
            {notification.link && (
              <Link
                href={notification.link}
                onClick={handleViewClick}
                className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                View →
              </Link>
            )}
          </div>
        </div>

        {/* Unread Indicator */}
        {!isRead && (
          <div className="w-2 h-2 bg-emerald-600 rounded-full flex-shrink-0 mt-2"></div>
        )}
      </div>
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  defaultEnabled,
}: {
  label: string;
  description: string;
  defaultEnabled: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="text-gray-900 mb-1">{label}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-emerald-600' : 'bg-gray-200'
          }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
      </button>
    </div>
  );
}
