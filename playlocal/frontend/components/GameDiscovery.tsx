import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  Clock,
  TrendingUp,
  Filter,
  Calendar,
  LayoutGrid,
  MapIcon,
  Sun,
  Loader2,
  X,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useGames } from '@/hooks/useGames';
import { GameResponse } from '@/lib/api';
import { getSportImage } from '@/constants/sportImages';
import MapView from './MapView';
import { useIsMobile } from '@/components/ui/use-mobile';

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
  const isMobile = useIsMobile();
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
  const [sheetAnimated, setSheetAnimated] = useState(false);

  const openFilterModal = () => {
    setShowFilterModal(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetAnimated(true)));
  };

  const closeFilterModal = () => {
    setSheetAnimated(false);
    setTimeout(() => setShowFilterModal(false), 320);
  };
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('nearest');
  const [showSortMenu, setShowSortMenu] = useState(false);

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

  const { games: apiGames, isLoading, refetch } = useGames(apiFilters);

  // Refetch when a game is updated (e.g. from GameRoom Save Changes) so Discover stays in sync
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('playlocal-refresh-games', handler);
    return () => window.removeEventListener('playlocal-refresh-games', handler);
  }, [refetch]);

  // Transform games - apply optional client-side filters (e.g. Today, search)
  const displayGames = useMemo(() => {
    let games = apiGames;
    if (todayOnly) {
      // Compare dates in a consistent timezone (UTC) to avoid local timezone discrepancies
      const todayUtcDateStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
      games = games.filter(
        (g) =>
          g.startTime &&
          new Date(g.startTime).toISOString().slice(0, 10) === todayUtcDateStr
      );
    }
    let transformed = games.map(transformApiGame);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      transformed = transformed.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.sport.toLowerCase().includes(q) ||
          g.distance.toLowerCase().includes(q)
      );
    }
    return transformed;
  }, [apiGames, todayOnly, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: '18px', paddingBottom: '18px' }}>
          {/* Search bar + view toggle in one row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            {/* Search bar */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search games, sports, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: searchQuery ? '36px' : '12px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  background: '#f9fafb',
                  color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              )}
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px', flexShrink: 0 }}>
              <button
                onClick={() => handleViewModeChange('grid')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: viewMode === 'grid' ? 'white' : 'transparent',
                  color: viewMode === 'grid' ? '#059669' : '#6b7280',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <LayoutGrid style={{ width: '18px', height: '18px' }} />
              </button>
              <button
                onClick={() => handleViewModeChange('map')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: viewMode === 'map' ? 'white' : 'transparent',
                  color: viewMode === 'map' ? '#059669' : '#6b7280',
                  boxShadow: viewMode === 'map' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <MapIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>

          {/* Sport chips row — horizontally scrollable */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
            className="mb-2"
          >
            {/* Filters chip — leads the row */}
            <button
              onClick={() => openFilterModal()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '999px',
                border: activeFilterCount > 0 ? 'none' : '1px solid #d1d5db',
                background: activeFilterCount > 0 ? '#059669' : 'white',
                color: activeFilterCount > 0 ? 'white' : '#374151',
                fontSize: '14px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                minHeight: '44px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Filter style={{ width: '15px', height: '15px' }} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span style={{
                  background: 'white',
                  color: '#059669',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '1px 7px',
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div style={{ width: '1px', background: '#e5e7eb', flexShrink: 0, margin: '6px 0' }} />

            {/* Sport chips */}
            <FilterChip
              label="All"
              active={!appliedFilters.sportName}
              onClick={() => {
                setAppliedFilters((prev) => ({ ...prev, sportName: '' }));
                setFilters((prev) => ({ ...prev, sportName: '' }));
              }}
            />
            <FilterChip label="Basketball" active={appliedFilters.sportName.toLowerCase() === 'basketball'} onClick={() => handleSportQuickFilter('Basketball')} />
            <FilterChip label="Soccer" active={appliedFilters.sportName.toLowerCase() === 'soccer'} onClick={() => handleSportQuickFilter('Soccer')} />
            <FilterChip label="Volleyball" active={appliedFilters.sportName.toLowerCase() === 'volleyball'} onClick={() => handleSportQuickFilter('Volleyball')} />
            <FilterChip label="Tennis" active={appliedFilters.sportName.toLowerCase() === 'tennis'} onClick={() => handleSportQuickFilter('Tennis')} />
            <FilterChip label="Badminton" active={appliedFilters.sportName.toLowerCase() === 'badminton'} onClick={() => handleSportQuickFilter('Badminton')} />
          </div>

          {/* Contextual chips row */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <FilterChip label="Today" active={todayOnly} onClick={() => setTodayOnly((prev) => !prev)} />
            <FilterChip label="Within 5km" active={appliedFilters.distance === 'within 5km'} onClick={handleDistanceQuickFilter} />
            <FilterChip label="My Skill Level" active={false} />
          </div>
        </div>
      </div>

      {/* Filter Modal / Bottom Sheet */}
      {isMobile && showFilterModal ? (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(0,0,0,0.5)',
              opacity: sheetAnimated ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
            onClick={() => closeFilterModal()}
            onKeyDown={(e) => { if (e.key === 'Escape') closeFilterModal(); }}
            tabIndex={0}
            aria-label="Filter drawer backdrop"
          />
          {/* Bottom sheet */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 51,
              background: 'white',
              borderRadius: '20px 20px 0 0',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px 20px',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
              transform: sheetAnimated ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Drag handle */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#d1d5db', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '20px' }}>Filter Games</h2>
            <FilterFormContent
              filters={filters}
              setFilters={setFilters}
              userLocation={userLocation}
              onClear={() => setFilters({ sportName: '', distance: 'any distance', skillLevel: 'any', locationType: 'any', intensity: 'any' })}
              onCancel={() => closeFilterModal()}
              onApply={() => { setAppliedFilters(filters); closeFilterModal(); }}
            />
          </div>
        </>
      ) : !isMobile && showFilterModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          onClick={() => closeFilterModal()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeFilterModal();
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
                onClick={() => closeFilterModal()}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <FilterFormContent
              filters={filters}
              setFilters={setFilters}
              userLocation={userLocation}
              onClear={() => setFilters({ sportName: '', distance: 'any distance', skillLevel: 'any', locationType: 'any', intensity: 'any' })}
              onCancel={() => closeFilterModal()}
              onApply={() => { setAppliedFilters(filters); closeFilterModal(); }}
            />
          </div>
        </div>
      ) : null}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: '10px', paddingBottom: '30px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading games...</span>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '15px', color: '#6b7280' }}>
                <span style={{ fontWeight: 700, color: '#059669', fontSize: '16px' }}>{displayGames.length}</span> games found
              </p>
              {/* Custom sort dropdown */}
              <div style={{ position: 'relative' }}>
                {showSortMenu && (
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setShowSortMenu(false)}
                  />
                )}
                <button
                  onClick={() => setShowSortMenu((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    color: '#374151',
                    fontWeight: 500,
                    padding: '4px 0',
                  }}
                >
                  <SlidersHorizontal style={{ width: '15px', height: '15px', color: '#6b7280' }} />
                  <span>{{ nearest: 'Nearest', soonest: 'Soonest', popular: 'Most Popular' }[sortBy]}</span>
                  <ChevronDown style={{ width: '14px', height: '14px', color: '#6b7280', transform: showSortMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>
                {showSortMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    zIndex: 20,
                    minWidth: '150px',
                    overflow: 'hidden',
                  }}>
                    {([['nearest', 'Nearest'], ['soonest', 'Soonest'], ['popular', 'Most Popular']] as const).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => { setSortBy(value); setShowSortMenu(false); }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '11px 16px',
                          background: sortBy === value ? '#f0fdf4' : 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: sortBy === value ? '#059669' : '#374151',
                          fontWeight: sortBy === value ? 600 : 400,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

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

function FilterSelect({
  value,
  onChange,
  options,
  direction = 'down',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  direction?: 'up' | 'down';
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div style={{ position: 'relative' }}>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          onClick={() => setOpen(false)}
        />
      )}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          background: 'white',
          fontSize: '14px',
          color: '#111827',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span>{current}</span>
        <ChevronDown style={{ width: '14px', height: '14px', color: '#6b7280', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          ...(direction === 'up'
            ? { bottom: 'calc(100% + 4px)' }
            : { top: 'calc(100% + 4px)' }),
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          zIndex: 20,
          overflow: 'hidden',
        }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                background: value === opt.value ? '#f0fdf4' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: value === opt.value ? '#059669' : '#374151',
                fontWeight: value === opt.value ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterFormContent({
  filters,
  setFilters,
  userLocation,
  onClear,
  onCancel,
  onApply,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  userLocation: { lat: number; lon: number } | null;
  onClear: () => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
          <FilterSelect
            value={filters.distance}
            onChange={(v) => setFilters({ ...filters, distance: v })}
            options={[
              { value: 'any distance', label: 'Any distance' },
              { value: 'within 5km', label: 'Within 5 km' },
              { value: 'within 10km', label: 'Within 10 km' },
              { value: 'within 20km', label: 'Within 20 km' },
            ]}
          />
          {!userLocation && filters.distance !== 'any distance' && (
            <p className="mt-1 text-xs text-amber-600">
              Location unavailable — distance filter won&apos;t apply. Please enable location access.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
          <FilterSelect
            value={filters.skillLevel}
            onChange={(v) => setFilters({ ...filters, skillLevel: v })}
            options={[
              { value: 'any', label: 'Any' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
          <FilterSelect
            value={filters.locationType}
            onChange={(v) => setFilters({ ...filters, locationType: v })}
            direction="up"
            options={[
              { value: 'any', label: 'Any' },
              { value: 'indoor', label: 'Indoor' },
              { value: 'outdoor', label: 'Outdoor' },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Intensity</label>
          <FilterSelect
            value={filters.intensity}
            onChange={(v) => setFilters({ ...filters, intensity: v })}
            direction="up"
            options={[
              { value: 'any', label: 'Any' },
              { value: 'casual', label: 'Casual' },
              { value: 'high', label: 'High' },
              { value: 'competitive', label: 'Competitive' },
            ]}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
        >
          <X className="w-4 h-4" />
          <span>Clear</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Search className="w-5 h-5" />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
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
      className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center min-h-[44px] ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:border-emerald-300'
      }`}
    >
      {label}
    </button>
  );
}
