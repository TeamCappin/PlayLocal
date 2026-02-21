import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Users, TrendingUp, Filter, Calendar, MapIcon, Cloud, Sun, Loader2, X, Search } from 'lucide-react';
import { useGames } from '@/hooks/useGames';
import { GameResponse } from '@/lib/api';
import MapView from './MapView';

// Helper to get image by sport (US 2.2)
function getSportImage(sport: string) {
  const images: Record<string, string> = {
    'Basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1080',
    'Soccer': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1080',
    'Tennis': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=1080',
    'Volleyball': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=1080',
    'Badminton': 'https://images.unsplash.com/photo-1599391398131-cd12dfc6c24e?auto=format&fit=crop&q=80&w=1080',
    'Baseball': '/images/sports/baseball.jpg',
    'Hockey': 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&q=80&w=1080',
    'Ultimate Frisbee': '/images/sports/ultimate-frisbee.jpg',
    'Flag Football': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1080',
    'Softball': 'https://images.unsplash.com/photo-1578432014316-48b448d79d57?auto=format&fit=crop&q=80&w=1080',
    'Pickleball': 'https://images.unsplash.com/photo-1526888935184-a82d2a4b7e67?auto=format&fit=crop&q=80&w=1080',
  };
  return images[sport] || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1080';
}

// Transform API response to display format
function transformApiGame(game: GameResponse) {
  const startDate = new Date(game.startTime);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long' });
  if (startDate.toDateString() === today.toDateString()) dateStr = 'Today';
  if (startDate.toDateString() === tomorrow.toDateString()) dateStr = 'Tomorrow';

  return {
    id: game.gameId,
    title: game.title,
    sport: game.sportName,
    location: (game.hasExactLocationAccess && game.location) ? game.location.name : 'Location Hidden', // Privacy-aware location [US-1.3]
    distance: (game.hasExactLocationAccess && game.location?.city) ? game.location.city : (game.approximateLocation || 'Nearby'), // Use approximate location if exact is hidden
    date: dateStr,
    time: startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    duration: game.endTime
      ? `${Math.round((new Date(game.endTime).getTime() - startDate.getTime()) / 3600000)} hours`
      : '2 hours',
    players: { current: game.confirmedCount, max: game.maxPlayers },
    skillLevel: game.skillBand || 'All Levels',
    intensity: game.intensityBand || 'Medium',
    indoor: game.indoorOutdoor === 'indoor',
    weather: null,
    host: game.organizer.displayName || 'Host',
    image: getSportImage(game.sportName),
    status: game.confirmedCount >= game.maxPlayers - 2 ? 'almost-full' : 'filling',
    minReliabilityRequired: game.minReliabilityRequired, // US-4.1: Reputation-gated games
  };
}

// Mock data for fallback - one game per sport
const mockGames: GameResponse[] = [
  {
    gameId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: '5v5 Basketball Pickup',
    sportName: 'Basketball',
    location: { name: 'Parc Jarry Courts', addressLine: '201 Rue Gary-Carter, Montréal, QC', city: 'Montreal', latitude: 45.5312, longitude: -73.6205 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
    confirmedCount: 8, maxPlayers: 10, minPlayers: 6,
    skillBand: 'Intermediate', intensityBand: 'High', indoorOutdoor: 'outdoor',
    description: 'Competitive 5v5 full court.',
    organizer: { userId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', displayName: 'Minh H.', reliabilityScore: 98 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 0, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    title: 'Sunday Soccer Friendly',
    sportName: 'Soccer',
    location: { name: 'Complexe Claude-Robillard', addressLine: '1000 Émile-Journault, Montréal', city: 'Montreal', latitude: 45.5401, longitude: -73.6241 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 5400000).toISOString(),
    confirmedCount: 12, maxPlayers: 22, minPlayers: 14,
    skillBand: 'All Levels', intensityBand: 'Casual', indoorOutdoor: 'outdoor',
    description: 'Casual 11v11 game. All levels welcome!',
    organizer: { userId: 'c3d4e5f6-a7b8-9012-cdef-234567890123', displayName: 'Sarah K.', reliabilityScore: 95 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 0, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    title: 'Beach Volleyball Tournament',
    sportName: 'Volleyball',
    location: { name: 'Parc Jean-Drapeau Beach', addressLine: 'Île Sainte-Hélène', city: 'Montreal', latitude: 45.5088, longitude: -73.5340 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 10800000).toISOString(),
    confirmedCount: 10, maxPlayers: 12, minPlayers: 8,
    skillBand: 'Intermediate', intensityBand: 'Competitive', indoorOutdoor: 'outdoor',
    description: '6v6 beach volleyball. Bring sunscreen!',
    organizer: { userId: 'd4e5f6a7-b890-1234-def0-456789012345', displayName: 'Omar E.', reliabilityScore: 92 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 2, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'd4e5f6a7-b890-1234-def0-567890123456',
    title: 'Tennis Doubles Match',
    sportName: 'Tennis',
    location: { name: 'Parc Lafontaine Tennis', addressLine: 'Avenue du Parc Lafontaine', city: 'Montreal', latitude: 45.5256, longitude: -73.5698 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 5400000).toISOString(),
    confirmedCount: 3, maxPlayers: 4, minPlayers: 4,
    skillBand: 'Intermediate', intensityBand: 'Competitive', indoorOutdoor: 'outdoor',
    description: 'Looking for 1 more for doubles!',
    organizer: { userId: 'e5f6a7b8-9012-3456-ef01-678901234567', displayName: 'Melissa R.', reliabilityScore: 97 },
    status: 'SCHEDULED', allowWaitlist: false, waitlistCount: 0, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'e5f6a7b8-9012-3456-ef01-789012345678',
    title: 'Badminton Drop-In',
    sportName: 'Badminton',
    location: { name: 'Centre sportif Côte-des-Neiges', addressLine: '4880 Avenue Van Horne', city: 'Montreal', latitude: 45.4920, longitude: -73.6241 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
    confirmedCount: 6, maxPlayers: 8, minPlayers: 4,
    skillBand: 'All Levels', intensityBand: 'Casual', indoorOutdoor: 'indoor',
    description: 'Casual badminton. Beginners welcome!',
    organizer: { userId: 'f6a7b890-1234-5678-f012-890123456789', displayName: 'Younes B.', reliabilityScore: 94 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 0, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'f6a7b890-1234-5678-f012-901234567890',
    title: 'Ultimate Frisbee Pickup',
    sportName: 'Ultimate Frisbee',
    location: { name: 'Parc Maisonneuve', addressLine: '4601 Rue Sherbrooke E', city: 'Montreal', latitude: 45.5569, longitude: -73.5497 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 9000000).toISOString(),
    confirmedCount: 10, maxPlayers: 14, minPlayers: 10,
    skillBand: 'Intermediate', intensityBand: 'Competitive', indoorOutdoor: 'outdoor',
    description: '7v7 ultimate. Spirit of the game!',
    organizer: { userId: 'a7b89012-3456-789a-0123-012345678901', displayName: 'Alex G.', reliabilityScore: 96 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 1, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'a7b89012-3456-789a-0123-123456789012',
    title: 'Flag Football League Game',
    sportName: 'Flag Football',
    location: { name: 'McGill Stadium', addressLine: '475 Avenue des Pins O', city: 'Montreal', latitude: 45.5087, longitude: -73.5816 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 5400000).toISOString(),
    confirmedCount: 12, maxPlayers: 14, minPlayers: 10,
    skillBand: 'Intermediate', intensityBand: 'Competitive', indoorOutdoor: 'outdoor',
    description: '7v7 flag football. No tackle!',
    organizer: { userId: 'b8901234-5678-9abc-1234-234567890123', displayName: 'David O.', reliabilityScore: 91 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 0, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'b8901234-5678-9abc-1234-345678901234',
    title: 'Softball Sunday',
    sportName: 'Softball',
    location: { name: 'Parc Jeanne-Mance', addressLine: 'Avenue du Mont-Royal', city: 'Montreal', latitude: 45.5163, longitude: -73.5854 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 10800000).toISOString(),
    confirmedCount: 14, maxPlayers: 18, minPlayers: 12,
    skillBand: 'All Levels', intensityBand: 'Casual', indoorOutdoor: 'outdoor',
    description: 'Friendly co-ed softball game.',
    organizer: { userId: 'c9012345-6789-abcd-2345-456789012345', displayName: 'Steven Z.', reliabilityScore: 93 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 0, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'c9012345-6789-abcd-2345-567890123456',
    title: 'Baseball Diamond Practice',
    sportName: 'Baseball',
    location: { name: 'Gary Carter Memorial Field', addressLine: 'Parc Jarry', city: 'Montreal', latitude: 45.5325, longitude: -73.6180 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 14400000).toISOString(),
    confirmedCount: 12, maxPlayers: 18, minPlayers: 10,
    skillBand: 'Intermediate', intensityBand: 'Competitive', indoorOutdoor: 'outdoor',
    description: '9-inning practice game.',
    organizer: { userId: 'd0123456-789a-bcde-3456-678901234567', displayName: 'Youssef Y.', reliabilityScore: 89 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 0, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'd0123456-789a-bcde-3456-789012345678',
    title: 'Pickleball Beginner Session',
    sportName: 'Pickleball',
    location: { name: 'YMCA du Parc', addressLine: '5550 Avenue du Parc', city: 'Montreal', latitude: 45.5214, longitude: -73.6058 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 9000000).toISOString(),
    confirmedCount: 6, maxPlayers: 8, minPlayers: 4,
    skillBand: 'Beginner', intensityBand: 'Casual', indoorOutdoor: 'indoor',
    description: 'Learn pickleball! Equipment provided.',
    organizer: { userId: 'e1234567-89ab-cdef-4567-890123456789', displayName: 'Hudson L.', reliabilityScore: 88 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 0, createdAt: new Date().toISOString(),
  },
  {
    gameId: 'e1234567-89ab-cdef-4567-901234567890',
    title: 'Hockey Shinny Night',
    sportName: 'Hockey',
    location: { name: 'Aréna Mont-Royal', addressLine: '1000 Avenue du Mont-Royal E', city: 'Montreal', latitude: 45.5271, longitude: -73.5720 },
    hasExactLocationAccess: true,
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 9000000).toISOString(),
    confirmedCount: 14, maxPlayers: 20, minPlayers: 12,
    skillBand: 'Intermediate', intensityBand: 'Competitive', indoorOutdoor: 'indoor',
    description: 'Drop-in hockey. Full gear required.',
    organizer: { userId: 'f2345678-9abc-def0-5678-012345678901', displayName: 'Allaye D.', reliabilityScore: 99 },
    status: 'SCHEDULED', allowWaitlist: true, waitlistCount: 3, createdAt: new Date().toISOString(),
  },
];

interface FilterState {
  sportName: string;
  distance: string;
  skillLevel: string;
  locationType: string;
  intensity: string;
}

export function GameDiscovery() {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    sportName: '',
    distance: 'any distance',
    skillLevel: 'any',
    locationType: 'any',
    intensity: 'any',
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    sportName: '',
    distance: 'any distance',
    skillLevel: 'any',
    locationType: 'any',
    intensity: 'any',
  });

  // Get user location on mount (optional)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Continue without location - distance filtering won't work
        }
      );
    }
  }, []);

  // Convert filter state to API format
  const apiFilters = useMemo(() => {
    const apiFilter: Record<string, string | number | boolean> = {};

    if (appliedFilters.sportName.trim()) {
      apiFilter.sportName = appliedFilters.sportName.trim();
    }

    if (appliedFilters.skillLevel !== 'any') {
      // Map to database format: Beginner, Intermediate, Advanced (capitalized)
      const skillLevelMap: Record<string, string> = {
        'beginner': 'Beginner',
        'intermediate': 'Intermediate',
        'advanced': 'Advanced',
      };
      apiFilter.skillLevel = skillLevelMap[appliedFilters.skillLevel.toLowerCase()] || appliedFilters.skillLevel;
    }

    if (appliedFilters.locationType !== 'any') {
      apiFilter.locationType = appliedFilters.locationType.toLowerCase();
    }

    if (appliedFilters.intensity !== 'any') {
      // Map to database format: Casual, High, Competitive (capitalized)
      const intensityMap: Record<string, string> = {
        'casual': 'Casual',
        'high': 'High',
        'competitive': 'Competitive',
      };
      apiFilter.intensity = intensityMap[appliedFilters.intensity.toLowerCase()] || appliedFilters.intensity;
    }

    // Distance filter - convert to radiusKm
    if (appliedFilters.distance !== 'any distance' && userLocation) {
      apiFilter.lat = userLocation.lat;
      apiFilter.lon = userLocation.lon;

      const distanceMap: Record<string, number> = {
        'within 5km': 5,
        'within 10km': 10,
        'within 20km': 20,
      };
      const radius = distanceMap[appliedFilters.distance.toLowerCase()];
      if (radius) {
        apiFilter.radiusKm = radius;
      }
    }

    return Object.keys(apiFilter).length > 0 ? apiFilter : undefined;
  }, [appliedFilters, userLocation]);

  const { games: apiGames, isLoading, error, refetch } = useGames(apiFilters);

  // Refetch when a game is updated (e.g. from GameRoom Save Changes) so Discover stays in sync
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("playlocal-refresh-games", handler);
    return () => window.removeEventListener("playlocal-refresh-games", handler);
  }, [refetch]);

  // Transform games - backend already filters, so just transform
  const displayGames = apiGames.map(transformApiGame);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl text-gray-900 mb-2">Discover Games</h1>
              <p className="text-gray-600">Find pickup games near you</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </button>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'grid'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Calendar className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'map'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <MapIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All Sports" active />
            <FilterChip label="Basketball" />
            <FilterChip label="Soccer" />
            <FilterChip label="Volleyball" />
            <FilterChip label="Tennis" />
            <FilterChip label="Today" />
            <FilterChip label="Within 5km" />
            <FilterChip label="My Skill Level" />
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowFilterModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Filter Games</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Sport Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sport Name</label>
                <input
                  type="text"
                  placeholder="Enter sport name (e.g., Basketball, Soccer)"
                  value={filters.sportName}
                  onChange={(e) => setFilters({ ...filters, sportName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
                  <select
                    value={filters.distance}
                    onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="any distance">Any distance</option>
                    <option value="within 5km">Within 5 km</option>
                    <option value="within 10km">Within 10 km</option>
                    <option value="within 20km">Within 20 km</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                  <select
                    value={filters.skillLevel}
                    onChange={(e) => setFilters({ ...filters, skillLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="any">Any</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
                  <select
                    value={filters.locationType}
                    onChange={(e) => setFilters({ ...filters, locationType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="any">Any</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Intensity</label>
                  <select
                    value={filters.intensity}
                    onChange={(e) => setFilters({ ...filters, intensity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="any">Any</option>
                    <option value="casual">Casual</option>
                    <option value="high">High</option>
                    <option value="competitive">Competitive</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setAppliedFilters(filters);
                    setShowFilterModal(false);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading games...</span>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{displayGames.length} games</span> found near you
                </p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option>Sort by: Nearest</option>
                <option>Sort by: Soonest</option>
                <option>Sort by: Most Popular</option>
              </select>
            </div>

            {displayGames.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl text-gray-900 mb-2">No games available</h3>
                <p className="text-gray-600 mb-6">Be the first to create a game in your area!</p>
                <Link
                  href="/games/create"
                  className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Create a Game
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayGames.map((game: GameDisplay) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </>

        ) : (
          <MapView />
        )}
      </div>
    </div>
  );
}

interface GameDisplay {
  id: string;
  title: string;
  sport: string;
  location: string;
  distance: string;
  date: string;
  time: string;
  duration: string;
  players: { current: number; max: number };
  skillLevel: string;
  intensity: string;
  indoor: boolean;
  weather: string | null;
  host: string;
  image: string;
  status: string;
  minReliabilityRequired?: number; // US-4.1: Reputation-gated games
}

function GameCard({ game }: { game: GameDisplay }) {
  const fillPercentage = (game.players.current / game.players.max) * 100;
  const statusColors: Record<string, string> = {
    filling: 'bg-emerald-100 text-emerald-700',
    'almost-full': 'bg-amber-100 text-amber-700',
    full: 'bg-gray-100 text-gray-700',
  };

  return (
    <Link
      href={`/games/${game.id}`}
      className="group bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-sm ${statusColors[game.status] || statusColors.filling}`}>
            {game.players.current}/{game.players.max} players
          </span>
        </div>
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm text-gray-700">
            {game.sport}
          </span>
          {game.minReliabilityRequired != null && (
            <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold">
              Min {game.minReliabilityRequired}% Reliability
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
          {game.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{game.location}</span>
            <span className="text-xs text-gray-400">• {game.distance}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              {game.date} at {game.time}
            </span>
            <span className="text-xs text-gray-400">• {game.duration}</span>
          </div>
          {game.weather && (
            <div className="flex items-center gap-2 text-gray-600">
              <Sun className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{game.weather}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4 text-sm flex-wrap">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
            {game.skillLevel}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
            {game.intensity} Intensity
          </span>
          {game.indoor && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Indoor</span>
          )}
          {game.minReliabilityRequired != null && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-semibold">
              Min {game.minReliabilityRequired}% Reliability
            </span>
          )}
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Spots filling up</span>
            <span>{Math.round(fillPercentage)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${fillPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm">
              {game.host[0]}
            </div>
            <span className="text-sm text-gray-600">Hosted by {game.host}</span>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
      </div>
    </Link>
  );
}

function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`px-4 py-2 rounded-full text-sm transition-colors ${active
        ? 'bg-emerald-600 text-white'
        : 'bg-white text-gray-700 border border-gray-300 hover:border-emerald-300'
        }`}
    >
      {label}
    </button>
  );
}