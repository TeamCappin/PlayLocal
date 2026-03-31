import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Clock,
  Plus,
  Loader2,
  X,
} from 'lucide-react';
import { useGames } from '@/hooks/useGames';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/components/ui/use-mobile';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface CalendarGame {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  sport: string;
  status: string;
  role: string;
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const { games: apiGames, isLoading } = useGames();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  // Transform API games to calendar format
  const games: CalendarGame[] = useMemo(() => {
    if (apiGames && apiGames.length > 0) {
      return apiGames.map((game) => ({
        id: game.gameId,
        title: game.title,
        date: new Date(game.startTime),
        time: new Date(game.startTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        location: game.location?.name || 'TBD',
        sport: game.sportName,
        status: 'confirmed',
        role: game.organizer?.userId === user?.userId ? 'host' : 'participant',
      }));
    }
    return [];
  }, [apiGames, user]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const getGamesForDate = (date: Date) => {
    return games.filter(
      (game) =>
        game.date.getDate() === date.getDate() &&
        game.date.getMonth() === date.getMonth() &&
        game.date.getFullYear() === date.getFullYear()
    );
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1)
    );
  };

  const openDayOverlay = (date: Date) => {
    setSelectedDay(date);
    requestAnimationFrame(() => setOverlayVisible(true));
  };

  const closeDayOverlay = () => {
    setOverlayVisible(false);
    setTimeout(() => setSelectedDay(null), 200);
  };

  useEffect(() => {
    if (!selectedDay) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDayOverlay();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedDay]);

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const weeks = Math.ceil((firstDay + daysInMonth) / 7);

  const selectedDayGames = selectedDay ? getGamesForDate(selectedDay) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">My Calendar</h1>
            <p className="text-gray-600">View and manage your upcoming games</p>
          </div>
          <Link
            href="/games/create"
            className="hidden sm:flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Game</span>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Calendar Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-gray-900">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => changeMonth(1)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('month')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      view === 'month'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setView('week')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      view === 'week'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setView('day')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      view === 'day'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Day
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-2 sm:p-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs sm:text-sm text-gray-600 py-1 sm:py-2"
                    >
                      {isMobile ? day.charAt(0) : day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {Array.from({ length: weeks * 7 }).map((_, index) => {
                    const dayNumber = index - firstDay + 1;
                    const isValidDay =
                      dayNumber > 0 && dayNumber <= daysInMonth;
                    const date = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      dayNumber
                    );
                    const isToday =
                      isValidDay &&
                      date.getDate() === new Date().getDate() &&
                      date.getMonth() === new Date().getMonth() &&
                      date.getFullYear() === new Date().getFullYear();
                    const dayGames = isValidDay ? getGamesForDate(date) : [];

                    if (isMobile) {
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => isValidDay && dayGames.length > 0 && openDayOverlay(date)}
                          className={`aspect-square p-1 rounded-lg border border-gray-200 flex flex-col items-center justify-center ${
                            !isValidDay
                              ? 'bg-gray-50'
                              : dayGames.length > 0
                                ? 'bg-white active:bg-gray-100 cursor-pointer'
                                : 'bg-white'
                          } transition-colors`}
                        >
                          {isValidDay && (
                            <>
                              <div
                                className={`text-xs ${
                                  isToday
                                    ? 'w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center'
                                    : 'text-gray-700'
                                }`}
                              >
                                {dayNumber}
                              </div>
                              {dayGames.length > 0 && (
                                <div className="mt-0.5 flex flex-col items-center">
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  <span className="text-[9px] text-emerald-600 font-medium leading-tight">
                                    {dayGames.length} {dayGames.length === 1 ? 'game' : 'games'}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </button>
                      );
                    }

                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] p-2 border border-gray-200 rounded-lg ${
                          !isValidDay
                            ? 'bg-gray-50'
                            : 'bg-white hover:bg-gray-50'
                        } transition-colors`}
                      >
                        {isValidDay && (
                          <>
                            <div
                              className={`text-sm mb-2 ${
                                isToday
                                  ? 'w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center'
                                  : 'text-gray-700'
                              }`}
                            >
                              {dayNumber}
                            </div>
                            <div className="space-y-1">
                              {dayGames.slice(0, 2).map((game) => (
                                <Link
                                  key={game.id}
                                  href={`/games/${game.id}`}
                                  className={`block px-2 py-1 text-xs rounded truncate ${
                                    game.role === 'host'
                                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                      : game.status === 'tentative'
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  } transition-colors`}
                                >
                                  {game.time} {game.sport}
                                </Link>
                              ))}
                              {dayGames.length > 2 && (
                                <div className="text-xs text-gray-500 px-2">
                                  +{dayGames.length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Games */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Upcoming Games</h3>
              <div className="space-y-3">
                {games
                  .filter((game) => game.date >= new Date())
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 5)
                  .map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-gray-900">{game.sport}</div>
                        {game.role === 'host' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {game.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {game.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at {game.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{game.location}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>

            {/* Legend */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-emerald-100 rounded"></div>
                  <span className="text-sm text-gray-700">Confirmed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-amber-100 rounded"></div>
                  <span className="text-sm text-gray-700">Waitlist</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-100 rounded"></div>
                  <span className="text-sm text-gray-700">Hosting</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Games Played</span>
                  <span className="text-gray-900">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Games Hosted</span>
                  <span className="text-gray-900">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="text-emerald-600">6</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Day Detail Overlay */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          onClick={closeDayOverlay}
          onKeyDown={(e) => { if (e.key === 'Escape') closeDayOverlay(); }}
          role="presentation"
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
              overlayVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {/* Content */}
          <div
            className={`relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 w-full max-w-sm overflow-hidden transition-all duration-200 ${
              overlayVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDay.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <button
                onClick={closeDayOverlay}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Games List */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {selectedDayGames.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No games scheduled</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayGames.map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.id}`}
                      className={`block p-3 rounded-xl border transition-colors ${
                        game.role === 'host'
                          ? 'border-purple-200/60 bg-purple-50/60 hover:bg-purple-100/60'
                          : game.status === 'tentative'
                            ? 'border-amber-200/60 bg-amber-50/60 hover:bg-amber-100/60'
                            : 'border-emerald-200/60 bg-emerald-50/60 hover:bg-emerald-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{game.sport}</span>
                        {game.role === 'host' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{game.title}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{game.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{game.location}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
