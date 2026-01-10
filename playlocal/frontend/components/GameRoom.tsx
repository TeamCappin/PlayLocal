import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Users, MessageCircle, Share2, Calendar, ExternalLink, CheckCircle, TrendingUp, Star, AlertCircle, Sun, Loader2, UserMinus, LogIn, Flag } from 'lucide-react';
import { useGame } from '@/hooks/useGames';
import { useAuth } from '@/context/AuthContext';
import { ReportModal } from './ReportModal';

// Mock data for fallback when backend unavailable
const mockGame = {
  gameId: '1',
  title: '5v5 Basketball Pickup',
  sportName: 'Basketball',
  location: { name: 'Parc Jarry Courts', addressLine: '201 Rue Gary-Carter, Montréal, QC H2R 2W1', city: 'Montreal' },
  hasExactLocationAccess: true, // US-1.3: Mock assumes participant access
  approximateLocation: 'Montreal, QC',
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  confirmedCount: 8,
  maxPlayers: 10,
  minPlayers: 6,
  skillBand: 'Intermediate',
  intensityBand: 'High',
  indoorOutdoor: 'outdoor',
  description: 'Looking for some competitive basketball! We\'ll do team balancing based on skill levels. Bring water and good vibes.',
  organizer: { userId: '1', displayName: 'Minh H.', reliabilityScore: 98 },
  status: 'SCHEDULED',
};

const mockRoster = {
  confirmed: [
    { participationId: '1', userId: '1', displayName: 'Minh Huynh', role: 'ORGANIZER', joinStatus: 'CONFIRMED', reliabilityScore: 98, joinedAt: new Date().toISOString() },
    { participationId: '2', userId: '2', displayName: 'Omar Elmasaoudi', role: 'PLAYER', joinStatus: 'CONFIRMED', reliabilityScore: 95, joinedAt: new Date().toISOString() },
    { participationId: '3', userId: '3', displayName: 'Asif Ali Khan', role: 'PLAYER', joinStatus: 'CONFIRMED', reliabilityScore: 92, joinedAt: new Date().toISOString() },
    { participationId: '4', userId: '4', displayName: 'Melissa Rahman', role: 'PLAYER', joinStatus: 'CONFIRMED', reliabilityScore: 88, joinedAt: new Date().toISOString() },
    { participationId: '5', userId: '5', displayName: 'Younes Bouhaba', role: 'PLAYER', joinStatus: 'CONFIRMED', reliabilityScore: 97, joinedAt: new Date().toISOString() },
    { participationId: '6', userId: '6', displayName: 'Alexander El Ghaoui', role: 'PLAYER', joinStatus: 'CONFIRMED', reliabilityScore: 90, joinedAt: new Date().toISOString() },
    { participationId: '7', userId: '7', displayName: 'David Onwionoko', role: 'PLAYER', joinStatus: 'CONFIRMED', reliabilityScore: 85, joinedAt: new Date().toISOString() },
    { participationId: '8', userId: '8', displayName: 'Steven Zrihen', role: 'PLAYER', joinStatus: 'CONFIRMED', reliabilityScore: 93, joinedAt: new Date().toISOString() },
  ],
  waitlisted: [
    { participationId: '9', userId: '9', displayName: 'Youssef Yacoub', role: 'PLAYER', joinStatus: 'WAITLISTED', waitlistPosition: 1, reliabilityScore: 87, joinedAt: new Date().toISOString() },
    { participationId: '10', userId: '10', displayName: 'Hudson Lu', role: 'PLAYER', joinStatus: 'WAITLISTED', waitlistPosition: 2, reliabilityScore: 82, joinedAt: new Date().toISOString() },
  ],
  maxPlayers: 10,
  spotsAvailable: 2,
};

export function GameRoom() {
  const params = useParams();
  const id = params?.id as string;
  const navigate = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { game: apiGame, roster: apiRoster, isLoading, error, joinGame, leaveGame, refetch } = useGame(id);

  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'lineup'>('details');
  const [message, setMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Use API data if available, fallback to mock
  const game = apiGame || mockGame;
  const roster = apiRoster || mockRoster;

  // Check if current user is in the game
  const currentUserParticipation = roster.confirmed.find(p => p.userId === user?.userId)
    || roster.waitlisted.find(p => p.userId === user?.userId);
  const isOrganizer = game.organizer?.userId === user?.userId;
  const isParticipant = !!currentUserParticipation;
  const isWaitlisted = currentUserParticipation?.joinStatus === 'WAITLISTED';

  // Format date/time
  const startDate = new Date(game.startTime);
  const endDate = game.endTime ? new Date(game.endTime) : null;
  const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const formattedTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const formattedEndTime = endDate?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const duration = endDate ? `${Math.round((endDate.getTime() - startDate.getTime()) / 3600000)} hours` : '2 hours';

  const handleJoin = async () => {
    if (!isAuthenticated) {
      navigate.push('/login');
      return;
    }

    setActionError(null);
    setIsJoining(true);
    try {
      const result = await joinGame();
      if (result.joinStatus === 'WAITLISTED') {
        setActionSuccess(`You're on the waitlist (#${result.waitlistPosition})`);
      } else {
        setActionSuccess('Successfully joined the game!');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setActionError(null);
    setIsLeaving(true);
    try {
      await leaveGame();
      setActionSuccess('Successfully left the game');
    } catch (err: any) {
      setActionError(err.message || 'Failed to leave game');
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-gray-600">Loading game...</span>
        </div>
      </div>
    );
  }

  const chatMessages = [
    { id: '1', user: 'Minh H.', avatar: 'MH', message: 'Hey everyone! Looking forward to the game!', time: '2:30 PM', isHost: true },
    { id: '2', user: 'Omar E.', avatar: 'OE', message: 'Should we bring our own ball or will there be one?', time: '2:45 PM' },
    { id: '3', user: 'Minh H.', avatar: 'MH', message: 'I\'ll bring one, but backup is always good!', time: '2:47 PM', isHost: true },
    { id: '4', user: 'Asif A.', avatar: 'AA', message: 'Is there parking nearby?', time: '3:15 PM' },
    { id: '5', user: 'Melissa R.', avatar: 'MR', message: 'Yes, street parking on Gary-Carter. Usually easy to find a spot.', time: '3:18 PM' },
  ];

  const spotsAvailable = game.maxPlayers - roster.confirmed.length;
  const isOutdoor = game.indoorOutdoor === 'outdoor';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Hero Image */}
      <div className="relative h-64 bg-gradient-to-br from-gray-900 to-gray-700">
        <img
          src="https://images.unsplash.com/photo-1709552899537-8f0a171aaf40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNrZXRiYWxsJTIwY291cnQlMjBvdXRkb29yfGVufDF8fHx8MTc2NjE2MTQzMnww&ixlib=rb-4.1.0&q=80&w=1080"
          alt={game.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">
                {game.sportName}
              </span>
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm">
                {game.skillBand || 'All Levels'}
              </span>
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm">
                {game.intensityBand || 'Medium'} Intensity
              </span>
            </div>
            <h1 className="text-4xl text-white mb-2">{game.title}</h1>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{formattedDate} at {formattedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{game.location?.name || game.approximateLocation || 'Location Hidden'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Messages */}
            {actionSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {actionError}
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${activeTab === 'details'
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('lineup')}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${activeTab === 'lineup'
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    Lineup ({roster.confirmed.length}/{game.maxPlayers})
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${activeTab === 'chat'
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Chat</span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">About this game</h3>
                      <p className="text-gray-600 leading-relaxed">{game.description || 'No description provided.'}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoCard icon={<Clock />} label="Duration" value={duration} />
                      <InfoCard icon={<Users />} label="Players" value={`${roster.confirmed.length}/${game.maxPlayers}`} />
                      <InfoCard icon={<MapPin />} label="Location Type" value={isOutdoor ? 'Outdoor' : 'Indoor'} />
                      <InfoCard icon={<Sun />} label="Weather" value={isOutdoor ? 'Check forecast' : 'N/A'} />
                    </div>

                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">Location</h3>
                      <div className="p-4 bg-gray-100 rounded-lg">
                        {game.hasExactLocationAccess && game.location ? (
                          <>
                            <p className="text-gray-900 mb-1">{game.location.name}</p>
                            <p className="text-gray-600 text-sm mb-3">{game.location.addressLine || game.location.city}</p>
                            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                              <ExternalLink className="w-4 h-4" />
                              <span>Open in Google Maps</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-5 h-5 text-gray-400" />
                              <p className="text-gray-900 font-medium">{game.approximateLocation || 'Location hidden'}</p>
                            </div>
                            <p className="text-gray-500 text-sm italic">
                              {isAuthenticated ? 'Join this game to view the exact location.' : 'Sign in and join to view location.'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">Game Rules & Requirements</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>Players must check in 15 minutes before start time</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>Teams will be balanced based on skill ratings</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>Bring your own water and towel</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>Respectful play - follow the code of conduct</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'lineup' && (
                  <div className="space-y-6">
                    {/* Team Balancing Info */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-emerald-900 mb-1">Smart Team Balancing Active</h4>
                          <p className="text-sm text-emerald-700">
                            Teams are automatically balanced based on skill levels and positions for fair play.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Confirmed Players */}
                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">Confirmed ({roster.confirmed.length})</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {roster.confirmed.map((player) => (
                          <div
                            key={player.participationId}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white">
                              {player.displayName?.[0] || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/profile/${player.displayName?.toLowerCase().replace(/\s+/g, '-') || player.userId}`}
                                  className="text-gray-900 truncate hover:text-emerald-600 transition-colors"
                                >
                                  {player.displayName}
                                </Link>
                                {player.role === 'ORGANIZER' && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">Host</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Reliability: {player.reliabilityScore}%</span>
                              </div>
                            </div>
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Waitlist */}
                    {roster.waitlisted.length > 0 && (
                      <div>
                        <h3 className="text-lg text-gray-900 mb-3">Waitlist ({roster.waitlisted.length})</h3>
                        <div className="space-y-2">
                          {roster.waitlisted.map((player) => (
                            <div
                              key={player.participationId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white">
                                  {player.displayName?.[0] || '?'}
                                </div>
                                <div>
                                  <Link
                                    href={`/profile/${player.displayName?.toLowerCase().replace(/\s+/g, '-') || player.userId}`}
                                    className="text-gray-900 hover:text-emerald-600 transition-colors"
                                  >
                                    {player.displayName}
                                  </Link>
                                  <div className="text-sm text-gray-600">
                                    Reliability: {player.reliabilityScore}%
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">#{player.waitlistPosition}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                      Chat is a demo. Real-time messaging coming in Phase 2.
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                            {msg.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-900">{msg.user}</span>
                              {msg.isHost && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">
                                  Host
                                </span>
                              )}
                              <span className="text-xs text-gray-500">{msg.time}</span>
                            </div>
                            <p className="text-gray-700">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Spots Available</span>
                  <span className="text-emerald-600">
                    {spotsAvailable > 0 ? `${spotsAvailable} left` : 'Full'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${(roster.confirmed.length / game.maxPlayers) * 100}%` }}
                  ></div>
                </div>
              </div>

              {isParticipant ? (
                <>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle className="w-5 h-5" />
                      <span>
                        {isWaitlisted
                          ? `You're on the waitlist (#${(currentUserParticipation as any)?.waitlistPosition || '?'})`
                          : "You're in this game!"}
                      </span>
                    </div>
                  </div>
                  {!isOrganizer && (
                    <button
                      onClick={handleLeave}
                      disabled={isLeaving}
                      className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLeaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserMinus className="w-5 h-5" />}
                      <span>Leave Game</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {!isAuthenticated ? (
                    <button
                      onClick={() => navigate.push('/login')}
                      className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mb-3 flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Login to Join</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={isJoining}
                      className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mb-3 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      <span>{spotsAvailable > 0 ? 'Join Game' : 'Join Waitlist'}</span>
                    </button>
                  )}
                </>
              )}

              <button className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" />
                <span>Share Game</span>
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Flag className="w-5 h-5" />
                  <span>Report Game</span>
                </button>
              )}
            </div>

            {/* Host Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Hosted by</h3>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white">
                  {game.organizer?.displayName?.[0] || 'H'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/profile/${game.organizer?.displayName?.toLowerCase().replace(/\s+/g, '-') || 'host'}`} className="text-gray-900 hover:text-emerald-600 transition-colors">
                      {game.organizer?.displayName || 'Host'}
                    </Link>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">Reliability: {game.organizer?.reliabilityScore || 100}%</span>
                  </div>
                  <Link href={`/profile/${game.organizer?.displayName?.toLowerCase().replace(/\s+/g, '-') || 'host'}`} className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
                    View Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Check-in opens</span>
                  <span className="text-gray-900">15 min before</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Game starts</span>
                  <span className="text-gray-900">{formattedTime}</span>
                </div>
                {formattedEndTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Estimated end</span>
                    <span className="text-gray-900">{formattedEndTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Weather Alert */}
            {isOutdoor && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-900 mb-1">Outdoor Game</h4>
                    <p className="text-sm text-amber-700">
                      Check the weather forecast before the game.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameId={game.gameId}
        targetName={game.title}
        reportType="game"
      />
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-emerald-600">{icon}</div>
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-gray-900">{value}</div>
      </div>
    </div>
  );
}
