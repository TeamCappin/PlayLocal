import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, Users, Clock, CheckCircle, X, UserX, MapPin, Star, Loader2 } from 'lucide-react';
import { friendsApi, FriendInfo } from '@/lib/api';

export function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'blocked'>('friends');
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendInfo[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch friends data from API
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const data = await friendsApi.getFriends();
        setFriends(data.friends || []);
        setPendingReceived(data.pendingReceived || []);
        setPendingSent(data.pendingSent || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load friends');
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      setActionLoading(friendshipId);
      await friendsApi.acceptRequest(friendshipId);
      // Move from pending to friends
      const accepted = pendingReceived.find(f => f.friendshipId === friendshipId);
      if (accepted) {
        setPendingReceived(prev => prev.filter(f => f.friendshipId !== friendshipId));
        setFriends(prev => [...prev, { ...accepted, status: 'ACCEPTED' }]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      setActionLoading(friendshipId);
      await friendsApi.declineRequest(friendshipId);
      setPendingReceived(prev => prev.filter(f => f.friendshipId !== friendshipId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (friendshipId: string) => {
    try {
      setActionLoading(friendshipId);
      await friendsApi.removeFriend(friendshipId);
      setPendingSent(prev => prev.filter(f => f.friendshipId !== friendshipId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      setActionLoading(friendshipId);
      await friendsApi.removeFriend(friendshipId);
      setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">Friends</h1>
            <p className="text-gray-600">Manage your connections and friend requests</p>
          </div>
          <Link
            href="/players"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>Find Players</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Overview</h3>
              <div className="space-y-4">
                <StatItem
                  icon={<Users className="w-5 h-5 text-emerald-600" />}
                  label="Friends"
                  value={friends.length}
                />
                <StatItem
                  icon={<Clock className="w-5 h-5 text-amber-600" />}
                  label="Pending Requests"
                  value={pendingReceived.length}
                />
                <StatItem
                  icon={<UserPlus className="w-5 h-5 text-blue-600" />}
                  label="Sent Requests"
                  value={pendingSent.length}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/players"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Find New Players
                </Link>
                <Link
                  href="/discover"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Invite to Game
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${activeTab === 'friends'
                        ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Friends</span>
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                        {friends.length}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${activeTab === 'requests'
                        ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Requests</span>
                      {pendingReceived.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                          {pendingReceived.length}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('blocked')}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${activeTab === 'blocked'
                        ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    Blocked
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'friends' && (
                  <div className="space-y-4">
                    {friends.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No friends yet. Find players to connect with!</p>
                        <Link href="/players" className="text-emerald-600 hover:underline mt-2 inline-block">
                          Find Players
                        </Link>
                      </div>
                    ) : (
                      friends.map((friend) => (
                        <FriendCard
                          key={friend.friendshipId}
                          friend={friend}
                          onRemove={() => handleRemoveFriend(friend.friendshipId)}
                          loading={actionLoading === friend.friendshipId}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    {/* Pending Received */}
                    {pendingReceived.length > 0 && (
                      <div>
                        <h3 className="text-lg text-gray-900 mb-4">
                          Pending Requests ({pendingReceived.length})
                        </h3>
                        <div className="space-y-4">
                          {pendingReceived.map((request) => (
                            <RequestCard
                              key={request.friendshipId}
                              request={request}
                              type="received"
                              onAccept={() => handleAcceptRequest(request.friendshipId)}
                              onDecline={() => handleDeclineRequest(request.friendshipId)}
                              loading={actionLoading === request.friendshipId}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sent Requests */}
                    {pendingSent.length > 0 && (
                      <div>
                        <h3 className="text-lg text-gray-900 mb-4">
                          Sent Requests ({pendingSent.length})
                        </h3>
                        <div className="space-y-4">
                          {pendingSent.map((request) => (
                            <RequestCard
                              key={request.friendshipId}
                              request={request}
                              type="sent"
                              onCancel={() => handleCancelRequest(request.friendshipId)}
                              loading={actionLoading === request.friendshipId}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingReceived.length === 0 && pendingSent.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No pending requests</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'blocked' && (
                  <div className="text-center py-12 text-gray-500">
                    <UserX className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No blocked users</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-gray-600">{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function FriendCard({ friend, onRemove, loading }: { friend: FriendInfo; onRemove: () => void; loading: boolean }) {
  const avatar = friend.displayName?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-4">
        <Link href={`/profile/${friend.friendUserId}`}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
            {avatar}
          </div>
        </Link>
        <div>
          <Link href={`/profile/${friend.friendUserId}`} className="font-medium text-gray-900 hover:text-emerald-600">
            {friend.displayName}
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {friend.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {friend.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {friend.reliabilityScore?.toFixed(0) || 0}%
            </span>
            <span>{friend.gamesCount || 0} games</span>
          </div>
        </div>
      </div>
      <button
        onClick={onRemove}
        disabled={loading}
        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
      </button>
    </div>
  );
}

function RequestCard({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
  loading
}: {
  request: FriendInfo;
  type: 'received' | 'sent';
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  loading: boolean;
}) {
  const avatar = request.displayName?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-4">
        <Link href={`/profile/${request.friendUserId}`}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
            {avatar}
          </div>
        </Link>
        <div>
          <Link href={`/profile/${request.friendUserId}`} className="font-medium text-gray-900 hover:text-emerald-600">
            {request.displayName}
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {request.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {request.location}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {type === 'received' ? (
          <>
            <button
              onClick={onAccept}
              disabled={loading}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Accept
            </button>
            <button
              onClick={onDecline}
              disabled={loading}
              className="flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
          </>
        ) : (
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
