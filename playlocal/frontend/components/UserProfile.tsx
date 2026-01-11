import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Calendar, TrendingUp, Award, Users, Star, CheckCircle, Edit, Settings, Flag, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { ReportModal } from './ReportModal';
import { ActionsRequired } from './sub-components/ActionsRequired';

export function UserProfile() {
  const { username } = useParams();
  const usernameStr = Array.isArray(username) ? username[0] : username;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'sports' | 'history' | 'stats'>('overview');
  const [showReportModal, setShowReportModal] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = !usernameStr || usernameStr === currentUser?.displayName?.toLowerCase().replace(/\s+/g, '-');

  // User data - uses AuthContext for own profile, would fetch from API for other profiles
  // TODO: Add API call to fetch other user profiles: GET /api/v1/users/{username}/profile
  const user = isOwnProfile && currentUser ? {
    name: currentUser.displayName,
    username: currentUser.displayName.toLowerCase().replace(/\s+/g, '-'),
    avatar: currentUser.displayName.substring(0, 2).toUpperCase(),
    bio: currentUser.bio || 'No bio yet. Click Edit Profile to add one!',
    location: currentUser.location || 'Location not set',
    memberSince: currentUser.createdAt
      ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Recently joined',
    verified: (currentUser as any).verified || false,
    userId: currentUser.userId,
    stats: {
      gamesPlayed: currentUser.gamesCount || 0,
      gamesHosted: (currentUser as any).gamesHosted || 0,
      reliabilityScore: currentUser.reliabilityScore || 100,
      averageRating: (currentUser as any).averageRating || 0,
    },
  } : {
    // Fallback for viewing other profiles - TODO: Replace with API data
    name: usernameStr?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown User',
    username: usernameStr || 'unknown',
    avatar: usernameStr?.substring(0, 2).toUpperCase() || '??',
    bio: 'Profile information loading...',
    location: 'Loading...',
    memberSince: 'Loading...',
    verified: false,
    userId: null,
    stats: {
      gamesPlayed: 0,
      gamesHosted: 0,
      reliabilityScore: 0,
      averageRating: 0,
    },
  };


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

  const skillEvolution = [
    { month: 'Jan', basketball: 6.5, soccer: 5.2 },
    { month: 'Feb', basketball: 6.7, soccer: 5.4 },
    { month: 'Mar', basketball: 6.9, soccer: 5.5 },
    { month: 'Apr', basketball: 7.0, soccer: 5.6 },
    { month: 'May', basketball: 7.2, soccer: 5.8 },
  ];

  const radarData = [
    { skill: 'Shooting', value: 75 },
    { skill: 'Defense', value: 82 },
    { skill: 'Passing', value: 88 },
    { skill: 'Speed', value: 70 },
    { skill: 'Teamwork', value: 92 },
    { skill: 'Stamina', value: 78 },
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
    { icon: '🤝', title: 'Team Player', description: 'Highest teamwork rating' },
    { icon: '⚡', title: 'Reliable', description: '98% attendance rate' },
  ];

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
                  {user.verified && <CheckCircle className="w-6 h-6 text-white" />}
                </div>
                <p className="text-emerald-100 mb-3">@{user.username}</p>
                <p className="text-white max-w-2xl mb-3">{user.bio}</p>
                <div className="flex items-center gap-4 text-emerald-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {user.memberSince}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
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

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Games Played" value={user.stats.gamesPlayed} />
            <StatCard label="Games Hosted" value={user.stats.gamesHosted} />
            <StatCard label="Reliability Score" value={`${user.stats.reliabilityScore}%`} />
            <StatCard label="Average Rating" value={user.stats.averageRating} icon={<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />} />
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 bg-white -mt-px">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-4 border-b-2 transition-colors ${activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sports')}
              className={`px-4 py-4 border-b-2 transition-colors ${activeTab === 'sports'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Sport Profiles
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-4 border-b-2 transition-colors ${activeTab === 'history'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Match History
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-4 border-b-2 transition-colors ${activeTab === 'stats'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Stats & Analytics
            </button>
          </div>
        </div>

        <div className="py-8">
          <ActionsRequired />
        </div>

        <div className="py-8">
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
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
                            <div className="text-emerald-600">{profile.skillRating}/10</div>
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
                  <h2 className="text-xl text-gray-900 mb-4">Recent Activity</h2>
                  <div className="space-y-3">
                    {recentGames.slice(0, 3).map((game) => (
                      <Link
                        key={game.id}
                        href={`/games/${game.id}/recap`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <div className="text-gray-900 mb-1">{game.title}</div>
                          <div className="text-sm text-gray-600">
                            {game.date} • {game.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`${game.result === 'Win' ? 'text-emerald-600' : 'text-gray-600'} mb-1`}>
                            {game.result}
                          </div>
                          <div className="text-sm text-gray-500">{game.score}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Achievements */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl text-gray-900 mb-4">Achievements</h2>
                  <div className="space-y-3">
                    {achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div>
                          <div className="text-gray-900">{achievement.title}</div>
                          <div className="text-sm text-gray-600">{achievement.description}</div>
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
                      <span className="text-gray-600">Win Rate</span>
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
                <SportProfileCard key={profile.sport} profile={profile} />
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl text-gray-900">Match History</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}/recap`}
                    className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white">
                        🏀
                      </div>
                      <div>
                        <div className="text-gray-900 mb-1">{game.title}</div>
                        <div className="text-sm text-gray-600">
                          {game.date} • {game.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg ${game.result === 'Win' ? 'text-emerald-600' : 'text-gray-600'} mb-1`}>
                        {game.result}
                      </div>
                      <div className="text-sm text-gray-500">
                        {game.team} • {game.score}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Skill Evolution Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl text-gray-900 mb-6">Skill Evolution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={skillEvolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="basketball" stroke="#10b981" strokeWidth={2} name="Basketball" />
                    <Line type="monotone" dataKey="soccer" stroke="#3b82f6" strokeWidth={2} name="Soccer" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl text-gray-900 mb-6">Basketball Skills</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="Skills" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Stats */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl text-gray-900 mb-6">Performance Stats</h2>
                  <div className="space-y-4">
                    <StatBar label="Win Rate" value={65} color="emerald" />
                    <StatBar label="Attendance Rate" value={98} color="blue" />
                    <StatBar label="Team Rating" value={92} color="purple" />
                    <StatBar label="Skill Confidence" value={82} color="amber" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={user.userId || undefined}
        targetName={user.name}
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
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

function SportProfileCard({ profile }: { profile: any }) {
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
              <span key={pos} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm">
                {pos}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm text-gray-600">Play Style</span>
          <p className="text-gray-900">{profile.playStyle}</p>
        </div>

        <div>
          <span className="text-sm text-gray-600">Availability</span>
          <div className="space-y-1 mt-1">
            {profile.availability.map((time: string) => (
              <div key={time} className="text-sm text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {time}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900">{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}