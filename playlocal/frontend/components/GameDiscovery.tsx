import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  Clock,
  TrendingUp,
  Filter,
  Calendar,
  MapIcon,
  Sun,
  Loader2,
  X,
  Search,
} from 'lucide-react';
import { useGames } from '@/hooks/useGames';
import { GameResponse } from '@/lib/api';
import { getSportImage } from '@/constants/sportImages';
import MapView from './MapView';

// Transform API response to display format
function transformApiGame(game: GameResponse) {
  const startDate = new Date(game.startTime);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long' });
  if (startDate.toDateString() === today.toDateString()) dateStr = 'Today';
  if (startDate.toDateString() === tomorrow.toDateString())
    dateStr = 'Tomorrow';

  return {
    id: game.gameId,
    title: game.title,
    sport: game.sportName,
    location:
      game.hasExactLocationAccess && game.location
        ? game.location.name
        : 'Location Hidden', // Privacy-aware location [US-1.3]
    distance:
      game.hasExactLocationAccess && game.location?.city
        ? game.location.city
        : game.approximateLocation || 'Nearby', // Use approximate location if exact is hidden
    date: dateStr,
    time: startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
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
    status:
      game.confirmedCount >= game.maxPlayers - 2 ? 'almost-full' : 'filling',
    minReliabilityRequired: game.minReliabilityRequired, // US-4.1: Reputation-gated games
    lat:
      game.hasExactLocationAccess && game.location?.latitude != null
        ? game.location.latitude
        : undefined,
    lng:
      game.hasExactLocationAccess && game.location?.longitude != null
        ? game.location.longitude
        : undefined,
  };
}

interface FilterState {
  sportName: string;
  distance: string;
  skillLevel: string;
  locationType: string;
  intensity: string;
}

export function GameDiscovery() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // URL is the source of truth: Browse Games = /discover (grid), Discover Games = /discover?view=map (map).
  // Defer setState to avoid synchronous setState in effect (cascading render warning).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const viewFromUrl = searchParams.get('view');
    const nextMode = viewFromUrl === 'map' ? 'map' : 'grid';
    const id = setTimeout(() => {
      setViewMode((prev) => {
        if (prev === nextMode) return prev;
        sessionStorage.setItem('playlocal-view-mode', nextMode);
        return nextMode;
      });
    }, 0);
    return () => clearTimeout(id);
  }, [searchParams]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
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

  const [todayOnly, setTodayOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'nearest' | 'soonest' | 'most_popular'>(
    'soonest'
  );
  const showLocationOffMessage = sortBy === 'nearest' && !userLocation;

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.sportName.trim()) count++;
    if (appliedFilters.distance !== 'any distance') count++;
    if (appliedFilters.skillLevel !== 'any') count++;
    if (appliedFilters.locationType !== 'any') count++;
    if (appliedFilters.intensity !== 'any') count++;
    return count;
  }, [appliedFilters]);

  // Save view mode preference to session storage when it changes
  const handleViewModeChange = (mode: 'grid' | 'map') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('playlocal-view-mode', mode);
    }
  };

  // Quick filter helpers — apply immediately without opening the modal
  const handleSportQuickFilter = (sport: string) => {
    const next =
      appliedFilters.sportName.toLowerCase() === sport.toLowerCase()
        ? ''
        : sport;
    // Sync both states so modal reflects current quick-filter state;
    // opening then clicking "Search" without changes is a no-op.
    setAppliedFilters((prev) => ({ ...prev, sportName: next }));
    setFilters((prev) => ({ ...prev, sportName: next }));
  };

  const handleDistanceQuickFilter = () => {
    if (!userLocation) {
      window.alert(
        'Unable to apply distance filter because your location is unavailable. Please enable location access and try again.'
      );
      return;
    }
    const next =
      appliedFilters.distance === 'within 5km' ? 'any distance' : 'within 5km';
    setAppliedFilters((prev) => ({ ...prev, distance: next }));
    setFilters((prev) => ({ ...prev, distance: next }));
  };

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
      apiFilter.sportName = appliedFilters.sportName.trim().toLowerCase();
    }

    if (appliedFilters.skillLevel !== 'any') {
      apiFilter.skillLevel = appliedFilters.skillLevel.toLowerCase();
    }

    if (appliedFilters.locationType !== 'any') {
      apiFilter.locationType = appliedFilters.locationType.toLowerCase();
    }

    if (appliedFilters.intensity !== 'any') {
      apiFilter.intensity = appliedFilters.intensity.toLowerCase();
    }

    // Distance filter - convert to radiusKm
    // Sort by filter - if 'nearest', backend needs lat/lon to sort by distance 
    if (userLocation &&
      (sortBy === 'nearest' || appliedFilters.distance !== 'any distance')
    ) {
      apiFilter.lat = userLocation.lat;
      apiFilter.lon = userLocation.lon;
      if (appliedFilters.distance !== 'any distance') {
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
    }

    return Object.keys(apiFilter).length > 0 ? apiFilter : undefined;
  }, [appliedFilters, userLocation, sortBy]);

  const { games: apiGames, isLoading, refetch } = useGames(apiFilters);

  // Refetch when a game is updated (e.g. from GameRoom Save Changes) so Discover stays in sync
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('playlocal-refresh-games', handler);
    return () => window.removeEventListener('playlocal-refresh-games', handler);
  }, [refetch]);

  // Transform games - apply optional client-side filters (e.g. Today) and sorting.
  // Nearest: backend returns distance-ordered list when we send lat/lon (GameRepository Haversine); when no userLocation, list is by startTime.
  const displayGames = useMemo(() => {
    let games = [...apiGames];
    if (todayOnly) {
      // Compare dates in a consistent timezone (UTC) to avoid local timezone discrepancies
      const todayUtcDateStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
      games = games.filter(
        (g) =>
          g.startTime &&
          new Date(g.startTime).toISOString().slice(0, 10) === todayUtcDateStr
      );
    }
    if (sortBy === 'soonest') {
      games.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    } else if (sortBy === 'most_popular') {
      games.sort(
        (a, b) =>
          (b.confirmedCount ?? 0) + (b.waitlistCount ?? 0) -
          ((a.confirmedCount ?? 0) + (a.waitlistCount ?? 0))
      );
    }
    // sortBy === 'nearest': order comes from backend when userLocation was sent; otherwise already by startTime
    return games.map(transformApiGame);
  }, [apiGames, todayOnly, sortBy]);

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
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeFilterCount > 0
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white text-emerald-600 rounded-full text-xs font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleViewModeChange('map')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'map'
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
            <FilterChip
              label="All Sports"
              active={!appliedFilters.sportName}
              onClick={() => {
                setAppliedFilters((prev) => ({ ...prev, sportName: '' }));
                setFilters((prev) => ({ ...prev, sportName: '' }));
              }}
            />
            <FilterChip
              label="Basketball"
              active={appliedFilters.sportName.toLowerCase() === 'basketball'}
              onClick={() => handleSportQuickFilter('Basketball')}
            />
            <FilterChip
              label="Soccer"
              active={appliedFilters.sportName.toLowerCase() === 'soccer'}
              onClick={() => handleSportQuickFilter('Soccer')}
            />
            <FilterChip
              label="Volleyball"
              active={appliedFilters.sportName.toLowerCase() === 'volleyball'}
              onClick={() => handleSportQuickFilter('Volleyball')}
            />
            <FilterChip
              label="Tennis"
              active={appliedFilters.sportName.toLowerCase() === 'tennis'}
              onClick={() => handleSportQuickFilter('Tennis')}
            />
            <FilterChip
              label="Today"
              active={todayOnly}
              onClick={() => setTodayOnly((prev) => !prev)}
            />
            <FilterChip
              label="Within 5km"
              active={appliedFilters.distance === 'within 5km'}
              onClick={handleDistanceQuickFilter}
            />
            <FilterChip
              label="My Skill Level"
              active={false}
              onClick={() => setShowFilterModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          onClick={() => setShowFilterModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowFilterModal(false);
            }
          }}
          tabIndex={0}
          aria-label="Filter modal backdrop"
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-full max-w-2xl mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-modal-title"
          >
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport Name
                </label>
                <input
                  type="text"
                  placeholder="Enter sport name (e.g., Basketball, Soccer)"
                  value={filters.sportName}
                  onChange={(e) =>
                    setFilters({ ...filters, sportName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance
                  </label>
                  <select
                    value={filters.distance}
                    onChange={(e) =>
                      setFilters({ ...filters, distance: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="any distance">Any distance</option>
                    <option value="within 5km">Within 5 km</option>
                    <option value="within 10km">Within 10 km</option>
                    <option value="within 20km">Within 20 km</option>
                  </select>
                  {!userLocation && filters.distance !== 'any distance' && (
                    <p className="mt-1 text-xs text-amber-600">
                      Location unavailable — distance filter won&apos;t apply.
                      Please enable location access.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level
                  </label>
                  <select
                    value={filters.skillLevel}
                    onChange={(e) =>
                      setFilters({ ...filters, skillLevel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="any">Any</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Type
                  </label>
                  <select
                    value={filters.locationType}
                    onChange={(e) =>
                      setFilters({ ...filters, locationType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="any">Any</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intensity
                  </label>
                  <select
                    value={filters.intensity}
                    onChange={(e) =>
                      setFilters({ ...filters, intensity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="any">Any</option>
                    <option value="casual">Casual</option>
                    <option value="high">High</option>
                    <option value="competitive">Competitive</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    const empty = {
                      sportName: '',
                      distance: 'any distance',
                      skillLevel: 'any',
                      locationType: 'any',
                      intensity: 'any',
                    };
                    setFilters(empty);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setAppliedFilters(filters);
                      setShowFilterModal(false);
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Search className="w-5 h-5" />
                    <span>Apply</span>
                  </button>
                </div>
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
                  <span className="font-semibold text-gray-900">
                    {displayGames.length} games
                  </span>{' '}
                  found near you
                </p>
              </div>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as 'nearest' | 'soonest' | 'most_popular'
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                aria-label="Sort games by"
              >
                <option value="nearest">Sort by: Nearest</option>
                <option value="soonest">Sort by: Soonest</option>
                <option value="most_popular">Sort by: Most Popular</option>
              </select>
            </div>

            {showLocationOffMessage && (
              <div
                className="mb-6 flex bg-amber-50 rounded-xl border border-gray-200 px-6 py-3 gap-4 items-center"
              >
                <div>
                  <MapPin className="text-red-600" />
                </div>
                <div className="text-gray-700">
                  Location is off. Please enable location services to sort games by distance.
                </div>
              </div>
            )}

            {displayGames.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl text-gray-900 mb-2">
                  No games available
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to create a game in your area!
                </p>
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
          <MapView
            games={displayGames.map((g) => ({
              id: g.id,
              title: g.title,
              sport: g.sport,
              locationArea: g.distance,
              location: g.location,
              date: g.date,
              time: g.time,
              players: g.players,
              skillLevel: g.skillLevel,
              lat: g.lat,
              lng: g.lng,
            }))}
          />
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
  lat?: number;
  lng?: number;
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
      className="group bg-white rounded-xl border border-gray-200 hover:border-emerald-400 hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-sm ${statusColors[game.status] || statusColors.filling}`}
          >
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
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
              Indoor
            </span>
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

function FilterChip({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm transition-colors ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:border-emerald-300'
      }`}
    >
      {label}
    </button>
  );
}
