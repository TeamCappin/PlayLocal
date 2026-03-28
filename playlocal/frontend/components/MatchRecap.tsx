import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Share2,
  Download,
  Trophy,
  Users,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  Camera,
  MessageCircle,
  ThumbsUp,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RateUserModal } from './RateUserModal';

export function MatchRecap() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<
    'summary' | 'stats' | 'highlights'
  >('summary');

  const recap = {
    id: '1',
    gameTitle: '5v5 Basketball Pickup',
    sport: 'Basketball',
    date: 'December 18, 2024',
    time: '6:00 PM - 8:00 PM',
    location: 'Parc Jarry Courts',
    result: 'Team 1 Wins',
    score: {
      team1: 21,
      team2: 18,
    },
    mvp: {
      name: 'Omar Elmasaoudi',
      avatar: 'OE',
      stats: ' 15 pts, 8 rebs, 3 asts',
    },
    image:
      'https://images.unsplash.com/photo-1709552899537-8f0a171aaf40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNrZXRiYWxsJTIwY291cnQlMjBvdXRkb29yfGVufDF8fHx8MTc2NjE2MTQzMnww&ixlib=rb-4.1.0&q=80&w=1080',
  };

  const teams = {
    team1: [
      {
        name: 'Minh Huynh',
        avatar: 'MH',
        points: 12,
        assists: 5,
        rebounds: 3,
        rating: 8.5,
      },
      {
        name: 'Omar Elmasaoudi',
        avatar: 'OE',
        points: 15,
        assists: 3,
        rebounds: 8,
        rating: 9.2,
      },
      {
        name: 'Asif Ali Khan',
        avatar: 'AK',
        points: 8,
        assists: 4,
        rebounds: 6,
        rating: 7.8,
      },
      {
        name: 'Melissa Rahman',
        avatar: 'MR',
        points: 6,
        assists: 2,
        rebounds: 2,
        rating: 7.2,
      },
      {
        name: 'Younes Bouhaba',
        avatar: 'YB',
        points: 10,
        assists: 6,
        rebounds: 4,
        rating: 8.3,
      },
    ],
    team2: [
      {
        name: 'Alexander El Ghaoui',
        avatar: 'AG',
        points: 14,
        assists: 3,
        rebounds: 5,
        rating: 8.7,
      },
      {
        name: 'David Onwionoko',
        avatar: 'DO',
        points: 9,
        assists: 2,
        rebounds: 7,
        rating: 7.9,
      },
      {
        name: 'Steven Zrihen',
        avatar: 'SZ',
        points: 11,
        assists: 4,
        rebounds: 3,
        rating: 8.1,
      },
      {
        name: 'Youssef Yacoub',
        avatar: 'YY',
        points: 7,
        assists: 5,
        rebounds: 4,
        rating: 7.5,
      },
      {
        name: 'Hudson Lu',
        avatar: 'HL',
        points: 5,
        assists: 3,
        rebounds: 2,
        rating: 7.0,
      },
    ],
  };

  const teamStats = [
    { stat: 'Field Goals', team1: 24, team2: 21 },
    { stat: 'Assists', team1: 20, team2: 17 },
    { stat: 'Rebounds', team1: 27, team2: 23 },
    { stat: 'Turnovers', team1: 8, team2: 12 },
  ];

  const highlights = [
    {
      id: '1',
      type: 'photo',
      caption: 'Game winning shot! 🏀',
      uploader: 'Minh H.',
      likes: 24,
      comments: 5,
      image:
        'https://images.unsplash.com/photo-1763318252210-7618a678c1f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjB0ZWFtJTIwY2VsZWJyYXRpb258ZW58MXx8fHwxNzY2Mjc2ODIzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: '2',
      type: 'photo',
      caption: 'Team photo after an intense game',
      uploader: 'Omar E.',
      likes: 18,
      comments: 3,
      image:
        'https://images.unsplash.com/photo-1715313055891-af120687e23b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjBwbGF5aW5nJTIwc3BvcnRzfGVufDF8fHx8MTc2NjI2Nzc4M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const awards = [
    {
      icon: '🏆',
      title: 'MVP',
      winner: 'Omar E.',
      reason: 'Highest overall rating',
    },
    {
      icon: '🎯',
      title: 'Sharpshooter',
      winner: 'Alexander E.',
      reason: 'Most points scored',
    },
    {
      icon: '🤝',
      title: 'Playmaker',
      winner: 'Younes B.',
      reason: 'Most assists',
    },
    {
      icon: '💪',
      title: 'Defensive Beast',
      winner: 'Omar E.',
      reason: 'Most rebounds',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-br from-gray-900 to-gray-700">
        <img
          src={recap.image}
          alt={recap.gameTitle}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">
                {recap.sport}
              </span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm">
                Game Complete
              </span>
            </div>
            <h1 className="text-4xl text-white mb-3">{recap.gameTitle}</h1>
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{recap.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{recap.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="text-emerald-600 mb-2">Final Score</div>
                <h2 className="text-4xl text-gray-900">
                  {recap.score.team1} - {recap.score.team2}
                </h2>
                <div className="mt-2 text-gray-600">{recap.result}</div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-gray-600 mb-2">Team 1</div>
                  <div className="text-3xl text-emerald-600">
                    {recap.score.team1}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full"
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 mb-2">Team 2</div>
                  <div className="text-3xl text-gray-900">
                    {recap.score.team2}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MVP Card */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🏆</div>
                <div className="flex-1">
                  <h3 className="text-lg text-amber-900 mb-1">Game MVP</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white">
                      {recap.mvp.avatar}
                    </div>
                    <div>
                      <div className="text-gray-900">{recap.mvp.name}</div>
                      <div className="text-sm text-gray-600">
                        {recap.mvp.stats}
                      </div>
                    </div>
                  </div>
                </div>
                <Award className="w-12 h-12 text-amber-500" />
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${
                      activeTab === 'summary'
                        ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${
                      activeTab === 'stats'
                        ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Player Stats
                  </button>
                  <button
                    onClick={() => setActiveTab('highlights')}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${
                      activeTab === 'highlights'
                        ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Highlights
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    {/* Game Summary */}
                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">
                        Game Summary
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        An intense matchup between two well-balanced teams. Team
                        1 took an early lead with strong shooting from Omar and
                        Minh. Team 2 fought back in the second half with
                        excellent defense and playmaking. The game came down to
                        the final possessions, with Team 1 securing the victory
                        21-18.
                      </p>
                    </div>

                    {/* Awards */}
                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">
                        Game Awards
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {awards.map((award, index) => (
                          <div
                            key={index}
                            className="p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{award.icon}</span>
                              <div className="text-gray-900">{award.title}</div>
                            </div>
                            <div className="text-emerald-600 mb-1">
                              {award.winner}
                            </div>
                            <div className="text-sm text-gray-600">
                              {award.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team Stats Comparison */}
                    <div>
                      <h3 className="text-lg text-gray-900 mb-4">
                        Team Comparison
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={teamStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="stat" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="team1" fill="#10b981" name="Team 1" />
                          <Bar dataKey="team2" fill="#3b82f6" name="Team 2" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="space-y-6">
                    {/* Team 1 */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                        <h3 className="text-lg text-gray-900">Team 1</h3>
                      </div>
                      <div className="space-y-2">
                        {teams.team1.map((player, index) => (
                          <PlayerStatRow
                            key={index}
                            player={player}
                            rank={index + 1}
                            gameId={recap.id}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <h3 className="text-lg text-gray-900">Team 2</h3>
                      </div>
                      <div className="space-y-2">
                        {teams.team2.map((player, index) => (
                          <PlayerStatRow
                            key={index}
                            player={player}
                            rank={index + 1}
                            gameId={recap.id}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'highlights' && (
                  <div className="space-y-6">
                    {highlights.length > 0 ? (
                      <>
                        {highlights.map((highlight) => (
                          <div
                            key={highlight.id}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            <img
                              src={highlight.image}
                              alt={highlight.caption}
                              className="w-full h-64 object-cover"
                            />
                            <div className="p-4">
                              <p className="text-gray-900 mb-2">
                                {highlight.caption}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Posted by {highlight.uploader}
                                </span>
                                <div className="flex items-center gap-4">
                                  <button className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 transition-colors">
                                    <ThumbsUp className="w-4 h-4" />
                                    <span className="text-sm">
                                      {highlight.likes}
                                    </span>
                                  </button>
                                  <button className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-sm">
                                      {highlight.comments}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                          <Camera className="w-5 h-5" />
                          <span>Upload Your Highlights</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No highlights yet</p>
                        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                          Upload First Highlight
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Share Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Share This Game</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" />
                  <span>Share Recap</span>
                </button>
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  <span>Download Stats</span>
                </button>
              </div>
            </div>

            {/* Game Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Game Info</h3>
              <div className="space-y-3">
                <InfoRow icon={<Calendar />} label="Date" value={recap.date} />
                <InfoRow icon={<Clock />} label="Time" value={recap.time} />
                <InfoRow
                  icon={<MapPin />}
                  label="Location"
                  value={recap.location}
                />
                <InfoRow icon={<Users />} label="Players" value="10" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/discover"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Find Similar Games
                </Link>
                <Link
                  href="/games/create"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Create Rematch
                </Link>
                <button
                  onClick={() => {
                    setActiveTab('stats');
                    if (typeof window !== 'undefined') {
                      window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Rate Players
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerStatRow({ player, rank, gameId }: { player: any; rank: number; gameId: string }) {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <span className="text-gray-500 w-6">{rank}</span>
      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white">
        {player.avatar}
      </div>
      <div className="flex-1">
        <div className="text-gray-900">{player.name}</div>
        <div className="text-sm text-gray-600">
          {player.points} pts • {player.assists} ast • {player.rebounds} reb
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-gray-900">{player.rating}</span>
        </div>
        <button
          onClick={() => setIsRatingModalOpen(true)}
          className="px-3 py-1 text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded shadow-sm transition-colors"
        >
          Rate
        </button>
      </div>

      <RateUserModal
        gameId={gameId}
        targetUserId={player.id || `mock-${player.name.replace(/\s+/g, '-').toLowerCase()}`}
        targetUserName={player.name}
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
      />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1">
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
