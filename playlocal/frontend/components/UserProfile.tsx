import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Star,
  CheckCircle,
  Edit,
  Settings,
  Flag,
  Loader2,
  AlertCircle,
  Medal,
  UserPlus,
  Gamepad2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ReportModal } from './ReportModal';
import {
  usersApi,
  UserDto,
  endorsementsApi,
  EndorsementResponse,
  ConnectionSignals,
} from '@/lib/api';
import { ScoreHistoryList } from './ScoreHistoryList';
import { ActionsRequired } from './sub-components/ActionsRequired';
import { MatchHistoryList } from './sub-components/MatchHistoryList';
import { usePastGames } from '@/hooks/useGames';
import { OrganizerQualityBadge } from './OrganizerQualityBadge';
import { ShowUpRateCard } from './stats/ShowUpRateCard';
import { AttendanceRateCard } from './stats/AttendanceRateCard';
import { SkillTrendChart } from './stats/SkillTrendChart';
import { TimeframeToggle } from './stats/TimeframeToggle';
import { PlayerRatingCard } from './stats/PlayerRatingCard';
import { useStats } from '@/hooks/useStats';

export function UserProfile() {
  const { username } = useParams();
  const usernameStr = Array.isArray(username) ? username[0] : username;
  const { user: currentUser, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'sports' | 'history' | 'stats' | 'score-history'
  >('overview');
  const [showReportModal, setShowReportModal] = useState(false);
  const [otherUser, setOtherUser] = useState<UserDto | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null); // Copilot fix #4: Error state
  // US 3.3 Organizer Endorsements
  const [endorsements, setEndorsements] = useState<EndorsementResponse[]>([]);
  const [loadingEndorsements, setLoadingEndorsements] = useState(false);
  const [endorsementToReport, setEndorsementToReport] =
    useState<EndorsementResponse | null>(null);
  // Attendance Disputes
  const [disputeGameId, setDisputeGameId] = useState<string | undefined>(
    undefined
  );
  const [disputeGameTitle, setDisputeGameTitle] = useState<string | undefined>(
    undefined
  );
  const [disputeScoreHistoryId, setDisputeScoreHistoryId] = useState<
    string | undefined
  >(undefined);
  const { games: pastGames } = usePastGames();
  // US-32: Connection signals when viewing another user
  const [connectionSignals, setConnectionSignals] =
    useState<ConnectionSignals | null>(null);
  const [loadingConnectionSignals, setLoadingConnectionSignals] =
    useState(false);

  // Check if viewing own profile (no param, "me", or slug matches current user)
  const currentUserSlug = currentUser?.displayName
    ?.toLowerCase()
    .replace(/\s+/g, '-');
  const isOwnProfile =
    !usernameStr || usernameStr === 'me' || usernameStr === currentUserSlug;

  // UUID regex for profile links that use userId (Friends, PlayerSearch, etc.)
  const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  // Fetch other user's profile if not own profile [US-1.3]
  useEffect(() => {
    if (!isOwnProfile && usernameStr) {
      const fetchData = async () => {
        setLoadingProfile(true);
        setProfileError(null);
        try {
          // Support both slug (john-doe) and userId (UUID) from URL
          const data = isUuid(usernameStr)
            ? await usersApi.getProfile(usernameStr)
            : await usersApi.getProfileBySlug(usernameStr);
          setOtherUser(data);
          if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
            window.scrollTo(0, 0);
          }
        } catch (err) {
          console.error('Failed to fetch profile', err);
          setProfileError('Failed to load profile. Please try again later.');
        } finally {
          setLoadingProfile(false);
        }
      };

      fetchData();
    }
  }, [isOwnProfile, usernameStr]);

  // Refresh auth user data when viewing own profile so stats are up-to-date
  useEffect(() => {
    if (isOwnProfile) {
      refreshUser();
    }
  }, [isOwnProfile]);

  // TODO: Implement friendship check via API
  const isFriend = false; // Placeholder for friendship status
  // Copilot fix #10: Renamed from canViewPrivateDetails to canViewActivityData
  const canViewActivityData = isOwnProfile || isFriend; // Privacy setting

  // User data - uses AuthContext for own profile, would fetch from API for other profiles
  // TODO: Add API call to fetch other user profiles: GET /api/v1/users/{username}/profile
  const user =
    isOwnProfile && currentUser
      ? {
          name: currentUser.displayName,
          username: currentUser.displayName.toLowerCase().replace(/\s+/g, '-'),
          avatar: currentUser.displayName.substring(0, 2).toUpperCase(),
          bio: currentUser.bio || 'No bio yet. Click Edit Profile to add one!',
          location: currentUser.location || 'Location not set',
          memberSince: currentUser.createdAt
            ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })
            : 'Recently joined',
          verified: (currentUser as any).verified || false,
          userId: currentUser.userId,
          profileRestricted: false,
          stats: {
            gamesPlayed: currentUser.gamesCount || 0,
            gamesHosted: (currentUser as any).gamesHosted || 0,
            reliabilityScore: currentUser.reliabilityScore ?? 100,
            averageRating: (currentUser as any).averageRating || 0,
          },
        }
      : {
          // Fallback for viewing other profiles
          name: otherUser
            ? otherUser.displayName
            : usernameStr
                ?.replace(/-/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown User',
          username: otherUser
            ? otherUser.displayName.toLowerCase().replace(/\s+/g, '-')
            : usernameStr || 'unknown',
          avatar: (otherUser ? otherUser.displayName : usernameStr || '??')
            .substring(0, 2)
            .toUpperCase(),
          bio: otherUser?.bio || 'No bio available',
          location: otherUser?.location || 'Location not set',
          profileRestricted: otherUser?.profileRestricted || false,
          memberSince: otherUser?.createdAt
            ? new Date(otherUser.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })
            : 'Recently joined',
          verified: false,
          userId: otherUser?.userId || null,
          stats: {
            gamesPlayed: otherUser?.gamesCount || 0,
            gamesHosted: 0,
            reliabilityScore: otherUser?.reliabilityScore || 0,
            averageRating: (otherUser as any)?.averageRating || 0,
          },
        };

  // US-32: Fetch connection signals when viewing another user
  useEffect(() => {
    if (!isOwnProfile && isAuthenticated && otherUser?.userId) {
      setLoadingConnectionSignals(true);
      usersApi
        .getConnectionSignals(otherUser.userId)
        .then(setConnectionSignals)
        .catch(() => setConnectionSignals(null))
        .finally(() => setLoadingConnectionSignals(false));
    } else {
      setConnectionSignals(null);
    }
  }, [isOwnProfile, isAuthenticated, otherUser?.userId]);

  // Fetch endorsements
  // US 3.3 Organizer Endorsements
  useEffect(() => {
    if (!user.userId) {
      return;
    }

    setLoadingEndorsements(true);
    endorsementsApi
      .getUserEndorsements(user.userId)
      .then((data) => {
        setEndorsements(data);
      })
      .catch((err) => {
        console.error('Failed to load endorsements', err);
      })
      .finally(() => {
        setLoadingEndorsements(false);
      });
  }, [user.userId]);

  const sportProfiles = [
    {
      sport: 'Basketball',
      level: 'Intermediate',
      skillRating: 7.2,
      gamesPlayed: 32,
      preferredPositions: ['Guard', 'Forward'],
      playStyle: 'Team Player',
      availability: ['Mon 6-9 PM', 'Wed 6-9 PM', 'Sat 10 AM-2 PM'],
    },
    {
      sport: 'Soccer',
      level: 'Beginner',
      skillRating: 5.8,
      gamesPlayed: 12,
      preferredPositions: ['Midfielder'],
      playStyle: 'Casual',
      availability: ['Sun 2-5 PM'],
    },
    {
      sport: 'Volleyball',
      level: 'Intermediate',
      skillRating: 6.5,
      gamesPlayed: 3,
      preferredPositions: ['Outside Hitter'],
      playStyle: 'Competitive',
      availability: ['Fri 7-10 PM'],
    },
  ];



  const recentGames = [
    {
      id: '1',
      title: '5v5 Basketball Pickup',
      sport: 'Basketball',
      date: 'Dec 18, 2024',
      location: 'Parc Jarry',
      result: 'Win',
      team: 'Team 1',
      score: '21-18',
      stats: { points: 12, assists: 5, rebounds: 3 },
    },
    {
      id: '2',
      title: 'Friendly Soccer Match',
      sport: 'Soccer',
      date: 'Dec 15, 2024',
      location: 'Claude-Robillard',
      result: 'Loss',
      team: 'Team 2',
      score: '3-4',
      stats: { goals: 1, assists: 1 },
    },
    {
      id: '3',
      title: 'Ultimate Frisbee Pickup',
      sport: 'Ultimate Frisbee',
      date: 'Dec 10, 2024',
      location: 'Parc La Fontaine',
      result: 'Win',
      team: 'Team 1',
      score: '15-12',
      stats: { catches: 8, throws: 15 },
    },
  ];

  const achievements = [
    { icon: '🏆', title: 'MVP', description: 'Earned 5 MVP awards' },
    { icon: '🎯', title: 'Sharpshooter', description: '80% shooting accuracy' },
    {
      icon: '🤝',
      title: 'Team Player',
      description: 'Highest teamwork rating',
    },
    { icon: '⚡', title: 'Reliable', description: '98% attendance rate' },
  ];

  // Copilot fix #4: Show error state
  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <span>{profileError}</span>
        </div>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-emerald-600 text-3xl shadow-lg">
                {user.avatar}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl text-white">{user.name}</h1>
                  {user.verified && (
                    <CheckCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <p className="text-emerald-100 mb-3">@{user.username}</p>
                {!user.profileRestricted && (
                  <>
                    {user.bio && <p className="text-white max-w-2xl mb-3">{user.bio}</p>}
                    <div className="flex items-center gap-4 text-emerald-100">
                      {user.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Member since {user.memberSince}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isOwnProfile ? (
                <>
                  <Link
                    href="/profile/edit"
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 bg-red-500/20 backdrop-blur-sm text-red-200 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                >
                  <Flag className="w-5 h-5" />
                  <span>Report</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid — always visible (community trust metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Games Played" value={user.stats.gamesPlayed} />
            <StatCard label="Games Hosted" value={user.stats.gamesHosted} />
            <StatCard
              label="Reliability Score"
              value={`${Math.round(user.stats.reliabilityScore)}%`}
            />
            {/* US 3.3 Organizer Endorsements */}
            <StatCard
              label="Endorsements"
              value={endorsements.length}
              icon={<Medal className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              label="Average Rating"
              value={user.stats.averageRating}
              icon={
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              }
            />
          </div>
          {/* US-7.12: Privacy indicator for restricted profiles */}
          {!isOwnProfile && user.profileRestricted && (
            <div className="mt-6 flex items-center justify-center gap-4 text-white/90">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <span className="text-lg font-medium">Some profile details are private</span>
            </div>
          )}
        </div>
      </div>

      {/* US-7.12: Trust signals for restricted profiles (OQS + Endorsements) */}
      {!isOwnProfile && user.profileRestricted && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {user.userId && (
                <OrganizerQualityBadge
                  userId={user.userId}
                  displayName={user.name}
                  variant="full"
                  showInfoCard={true}
                />
              )}
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-gray-900">Endorsements</h2>
                  <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-sm font-medium">
                    <Medal className="w-4 h-4" />
                    {endorsements.length}
                  </div>
                </div>
                {loadingEndorsements && (
                  <div className="text-center py-4 text-gray-400">
                    Loading endorsements...
                  </div>
                )}
                {!loadingEndorsements && endorsements.length > 0 && (
                  <div className="space-y-3">
                    {endorsements.slice(0, 5).map((endorsement) => (
                      <div
                        key={endorsement.endorsementId}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="bg-white p-2 rounded-full shadow-sm text-emerald-500">
                          <Medal className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-900 font-medium">
                            Organizer Pick
                          </div>
                          <div className="text-sm text-gray-600">
                            by {endorsement.endorserName}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(endorsement.gameDate).toLocaleDateString()}{' '}
                            • {endorsement.gameTitle}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!loadingEndorsements && endorsements.length === 0 && (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <Medal className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No endorsements yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs — hidden for private profiles */}
      {!isOwnProfile && user.profileRestricted ? null : <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 bg-white -mt-px">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-4 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sports')}
              className={`px-4 py-4 border-b-2 transition-colors ${
                activeTab === 'sports'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sport Profiles
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-4 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Match History
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-4 border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Stats & Analytics
            </button>
            <button
              onClick={() => setActiveTab('score-history')}
              className={`px-4 py-4 border-b-2 transition-colors ${
                activeTab === 'score-history'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Score History
            </button>
          </div>
        </div>

        <div>
          <ActionsRequired />
        </div>

        <div className="py-8">
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* US-6.1: Organizer Quality Score */}
                {user.userId && (
                  <OrganizerQualityBadge
                    userId={user.userId}
                    displayName={user.name}
                    variant="full"
                    showInfoCard={true}
                  />
                )}

                {/* Sport Profiles Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl text-gray-900 mb-4">Sport Profiles</h2>
                  <div className="space-y-3">
                    {sportProfiles.map((profile) => (
                      <div
                        key={profile.sport}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white">
                            🏀
                          </div>
                          <div>
                            <div className="text-gray-900">{profile.sport}</div>
                            <div className="text-sm text-gray-600">
                              {profile.level} • {profile.gamesPlayed} games
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-gray-900">Skill Rating</div>
                            <div className="text-emerald-600">
                              {profile.skillRating}/10
                            </div>
                          </div>
                          <button className="text-emerald-600 hover:text-emerald-700">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl text-gray-900 mb-4">
                    Recent Activity
                  </h2>
                  {canViewActivityData ? (
                    <div className="space-y-3">
                      {recentGames.slice(0, 3).map((game) => (
                        <Link
                          key={game.id}
                          href={`/games/${game.id}/recap`}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <div className="text-gray-900 mb-1">
                              {game.title}
                            </div>
                            <div className="text-sm text-gray-600">
                              {game.date} • {game.location}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`${game.result === 'Win' ? 'text-emerald-600' : 'text-gray-600'} mb-1`}
                            >
                              {game.result}
                            </div>
                            <div className="text-sm text-gray-500">
                              {game.score}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic p-4 text-center">
                      Add {user.name} as a friend to see their recent activity.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* US-32: Connection signals (mutual friends + co-play) - only when viewing another user and logged in */}
                {!isOwnProfile && isAuthenticated && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      Connection
                    </h2>
                    {loadingConnectionSignals ? (
                      <div className="flex items-center gap-2 text-gray-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <UserPlus className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <div>
                            {connectionSignals &&
                            connectionSignals.mutualFriendCount > 0 ? (
                              <span className="text-gray-900">
                                {connectionSignals.mutualFriendCount} mutual
                                friend
                                {connectionSignals.mutualFriendCount !== 1
                                  ? 's'
                                  : ''}
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                No mutuals yet
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Gamepad2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <div>
                            {connectionSignals &&
                            connectionSignals.coPlayCount > 0 ? (
                              <span className="text-gray-900">
                                Played together {connectionSignals.coPlayCount}{' '}
                                time
                                {connectionSignals.coPlayCount !== 1
                                  ? 's'
                                  : ''}{' '}
                                in last 60 days
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                No games together yet
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Endorsements - US 3.3 Organizer Endorsements */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl text-gray-900">Endorsements</h2>
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-sm font-medium">
                      <Medal className="w-4 h-4" />
                      {endorsements.length}
                    </div>
                  </div>
                  {loadingEndorsements && (
                    <div className="text-center py-4 text-gray-400">
                      Loading endorsements...
                    </div>
                  )}
                  {!loadingEndorsements && endorsements.length > 0 && (
                    <div className="space-y-3">
                      {endorsements.slice(0, 5).map((endorsement) => (
                        <div
                          key={endorsement.endorsementId}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group"
                        >
                          <div className="bg-white p-2 rounded-full shadow-sm text-emerald-500">
                            <Medal className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-900 font-medium">
                              Organizer Pick
                            </div>
                            <div className="text-sm text-gray-600">
                              by {endorsement.endorserName}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(
                                endorsement.gameDate
                              ).toLocaleDateString()}{' '}
                              • {endorsement.gameTitle}
                            </div>
                          </div>
                          <button
                            onClick={() => setEndorsementToReport(endorsement)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 rounded"
                            title="Report Endorsement"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {endorsements.length > 5 && (
                        <div className="text-center pt-2">
                          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                            View All ({endorsements.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {!loadingEndorsements && endorsements.length === 0 && (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                      <Medal className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No endorsements yet</p>
                    </div>
                  )}
                </div>

                {/* Achievements */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl text-gray-900 mb-4">Achievements</h2>
                  <div className="space-y-3">
                    {achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="text-3xl">{achievement.icon}</div>
                        <div>
                          <div className="text-gray-900">
                            {achievement.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl text-gray-900 mb-4">This Month</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Games Played</span>
                      <span className="text-gray-900">8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Show-up Rate</span>
                      <span className="text-emerald-600">62.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Avg. Rating</span>
                      <span className="text-gray-900">4.9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sports' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {sportProfiles.map((profile) => (
                <SportProfileCard
                  key={profile.sport}
                  profile={profile}
                  showAvailability={canViewActivityData}
                />
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div>
                <h2 className="text-xl text-gray-900 mb-4">Match History</h2>
              </div>
              {canViewActivityData ? (
                //Adding a temporary div to fix layout shift while MatchHistoryList is being updated
                <div className="space-y-3">
                  {pastGames.map((game) => (
                    <MatchHistoryList key={game.gameId} game={game} />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Match History is Private
                  </h3>
                  <p className="text-gray-500">
                    You must be friends with {user.name} to view their full
                    match history.
                  </p>
                </div>
              )}
            </div>
          )}


          {activeTab === 'stats' && (
            <StatsTabContent />
          )}

          {activeTab === 'score-history' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Reliability Score History
              </h2>
              <ScoreHistoryList
                userId={isOwnProfile ? undefined : user.userId || undefined}
                onDisputeClick={(entry) => {
                  setDisputeGameId(entry.gameId || undefined);
                  setDisputeGameTitle(entry.gameTitle || undefined);
                  setDisputeScoreHistoryId(entry.scoreHistoryId);
                  setShowReportModal(true);
                }}
              />
            </div>
          )}
        </div>
      </div>}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setDisputeGameId(undefined);
          setDisputeGameTitle(undefined);
          setDisputeScoreHistoryId(undefined);
        }}
        reportedUserId={user.userId || undefined}
        gameId={disputeGameId}
        targetName={user.name}
        reportType={disputeScoreHistoryId ? 'attendance_dispute' : 'user'}
        gameTitle={disputeGameTitle}
        scoreHistoryId={disputeScoreHistoryId}
      />

      {/* Endorsement Report Modal */}
      <ReportModal
        isOpen={!!endorsementToReport}
        onClose={() => setEndorsementToReport(null)}
        endorsementId={endorsementToReport?.endorsementId}
        targetName="Endorsement"
        reportType="endorsement"
      />

    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      <div className="text-emerald-100 text-sm mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-2xl text-white">{value}</span>
        {icon}
      </div>
    </div>
  );
}

function SportProfileCard({
  profile,
  showAvailability,
}: {
  profile: any;
  showAvailability: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-xl">
            🏀
          </div>
          <div>
            <h3 className="text-xl text-gray-900">{profile.sport}</h3>
            <p className="text-gray-600">{profile.level}</p>
          </div>
        </div>
        <button className="text-emerald-600 hover:text-emerald-700">
          <Edit className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Skill Rating</span>
            <span className="text-emerald-600">{profile.skillRating}/10</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(profile.skillRating / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <span className="text-sm text-gray-600">Games Played</span>
          <p className="text-gray-900">{profile.gamesPlayed}</p>
        </div>

        <div>
          <span className="text-sm text-gray-600">Preferred Positions</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {profile.preferredPositions.map((pos: string) => (
              <span
                key={pos}
                className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm"
              >
                {pos}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm text-gray-600">Play Style</span>
          <p className="text-gray-900">{profile.playStyle}</p>
        </div>

        {showAvailability && (
          <div>
            <span className="text-sm text-gray-600">Availability</span>
            <div className="space-y-1 mt-1">
              {profile.availability.map((time: string) => (
                <div
                  key={time}
                  className="text-sm text-gray-700 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {time}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsTabContent() {
  const { showUpRate, skillTrend, attendanceRate, playerRating, timeframe, setTimeframe } = useStats();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Stats & Analytics</h2>
        <TimeframeToggle value={timeframe} onChange={setTimeframe} />
      </div>

      {/* Performance Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg text-gray-900 mb-4">Performance Stats</h3>
        <div className="space-y-4">
          <ShowUpRateCard
            data={showUpRate.data}
            isLoading={showUpRate.isLoading}
            error={showUpRate.error}
          />
          <AttendanceRateCard
            data={attendanceRate.data}
            isLoading={attendanceRate.isLoading}
            error={attendanceRate.error}
          />
          <PlayerRatingCard
            data={playerRating.data}
            isLoading={playerRating.isLoading}
            error={playerRating.error}
          />
        </div>
      </div>

      {/* Skill Evolution */}
      <SkillTrendChart
        data={skillTrend.data}
        isLoading={skillTrend.isLoading}
        error={skillTrend.error}
      />
    </div>
  );
}
