import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, UserPlus, Filter, Loader2, CheckCircle, UserCheck, Clock } from 'lucide-react';
import { usersApi, friendsApi, UserDto, FriendInfo } from '@/lib/api';

export function PlayerSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [players, setPlayers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  
  // Track friend status for each player
  const [friendsMap, setFriendsMap] = useState<Map<string, FriendInfo>>(new Map());
  const [pendingSentMap, setPendingSentMap] = useState<Map<string, FriendInfo>>(new Map());
  const [pendingReceivedMap, setPendingReceivedMap] = useState<Map<string, FriendInfo>>(new Map());

  // Fetch friends list to check existing relationships
  const fetchFriendsList = useCallback(async () => {
    try {
      const friendsData = await friendsApi.getFriends();
      
      // Create maps for quick lookup
      const friends = new Map<string, FriendInfo>();
      const sent = new Map<string, FriendInfo>();
      const received = new Map<string, FriendInfo>();
      
      (friendsData.friends || []).forEach(friend => {
        friends.set(friend.friendUserId, friend);
      });
      
      (friendsData.pendingSent || []).forEach(request => {
        sent.set(request.friendUserId, request);
      });
      
      (friendsData.pendingReceived || []).forEach(request => {
        received.set(request.friendUserId, request);
      });
      
      setFriendsMap(friends);
      setPendingSentMap(sent);
      setPendingReceivedMap(received);
    } catch (err: any) {
      // Log error but don't block the page
      console.error('Failed to load friends list:', err);
      // Set empty maps on error
      setFriendsMap(new Map());
      setPendingSentMap(new Map());
      setPendingReceivedMap(new Map());
    }
  }, []);

  // Debounced search
  const searchPlayers = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const response = await usersApi.search(query, 0, 50);
      setPlayers(response.users || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to search players');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFriendsList();
    searchPlayers('');
  }, [fetchFriendsList, searchPlayers]);

  // Search on query change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlayers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPlayers]);

  const handleAddFriend = async (userId: string) => {
    try {
      setSendingRequestTo(userId);
      setError(null);
      
      // Prevent duplicate requests
      if (friendsMap.has(userId) || pendingSentMap.has(userId) || pendingReceivedMap.has(userId)) {
        return;
      }
      
      const response = await friendsApi.sendRequest(userId);
      
      // Update the pending sent map
      const friendInfo: FriendInfo = {
        friendshipId: response.friendshipId,
        friendUserId: userId,
        displayName: players.find(p => p.userId === userId)?.displayName || '',
        status: 'PENDING',
        reliabilityScore: 0,
        gamesCount: 0,
        createdAt: new Date().toISOString(),
      };
      
      setPendingSentMap(prev => new Map(prev).set(userId, friendInfo));
    } catch (err: any) {
      // Extract user-friendly error message from various possible formats
      let errorMessage = 'Failed to send friend request';
      
      // Try multiple ways to extract the error message
      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Handle specific error cases
      const lowerMessage = errorMessage.toLowerCase();
      if (lowerMessage.includes('already exists') || 
          lowerMessage.includes('friend request already') ||
          lowerMessage.includes('duplicate')) {
        setError('A friend request already exists with this user');
        // Refresh friends list to get accurate state
        await fetchFriendsList();
      } else if (lowerMessage.includes('yourself')) {
        setError('You cannot send a friend request to yourself');
      } else if (lowerMessage.includes('not found')) {
        setError('User not found');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSendingRequestTo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Find Players</h1>
          <p className="text-gray-600">Connect with local sports enthusiasts</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3 border rounded-lg transition-colors ${showFilters
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                  <option value="">All Sports</option>
                  <option value="basketball">Basketball</option>
                  <option value="soccer">Soccer</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="tennis">Tennis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                  <option value="">Any Time</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="evenings">Evenings</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : players.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No players found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const isFriend = friendsMap.has(player.userId);
              const hasPendingSent = pendingSentMap.has(player.userId);
              const hasPendingReceived = pendingReceivedMap.has(player.userId);
              
              return (
                <PlayerCard
                  key={player.userId}
                  player={player}
                  onAddFriend={() => handleAddFriend(player.userId)}
                  loading={sendingRequestTo === player.userId}
                  isFriend={isFriend}
                  requestSent={hasPendingSent}
                  requestReceived={hasPendingReceived}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  onAddFriend,
  loading,
  isFriend,
  requestSent,
  requestReceived,
}: {
  player: UserDto;
  onAddFriend: () => void;
  loading: boolean;
  isFriend: boolean;
  requestSent: boolean;
  requestReceived: boolean;
}) {
  const avatar = player.displayName?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <Link href={`/profile/${player.userId}`} className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
            {avatar}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 hover:text-emerald-600">{player.displayName}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {player.location && (
                <>
                  <MapPin className="w-3 h-3" />
                  <span>{player.location}</span>
                </>
              )}
            </div>
          </div>
        </Link>
      </div>

      <div className="space-y-3 mb-4">
        {player.bio && (
          <p className="text-sm text-gray-600 line-clamp-2">{player.bio}</p>
        )}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Star className="w-4 h-4 text-amber-500" />
            <span>{player.reliabilityScore?.toFixed(0) || 0}% reliable</span>
          </div>
          <span className="text-gray-600">{player.gamesCount || 0} games</span>
        </div>
        {player.defaultIntensity && (
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${player.defaultIntensity === 'competitive'
              ? 'bg-red-100 text-red-700'
              : player.defaultIntensity === 'casual'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
            {player.defaultIntensity.charAt(0).toUpperCase() + player.defaultIntensity.slice(1)}
          </span>
        )}
      </div>

      {isFriend ? (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
        >
          <UserCheck className="w-4 h-4" />
          <span>Already Friends</span>
        </button>
      ) : requestReceived ? (
        <Link
          href="/friends"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Request Received</span>
        </Link>
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!loading && !requestSent && !isFriend && !requestReceived) {
              onAddFriend();
            }
          }}
          disabled={loading || requestSent || isFriend || requestReceived}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            requestSent || isFriend || requestReceived
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : requestSent ? (
            <>
              <Clock className="w-4 h-4" />
              <span>Request Sent</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Add Friend</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
