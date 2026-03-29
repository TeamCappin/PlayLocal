import { format } from 'date-fns/format';
import type { GameResponse } from '@/lib/api';

/** US-7.5 AC2: match list sort direction. */
export type MatchHistorySortOrder = 'newest_first' | 'oldest_first';

/** UI filter + sort state for Match History (US-7.5 AC1–AC2). */
export type MatchHistoryFilterState = {
  sport: string;
  result: 'all' | 'win' | 'loss';
  /** `yyyy-mm-dd` or empty */
  dateFrom: string;
  dateTo: string;
  sortOrder: MatchHistorySortOrder;
};

export const defaultMatchHistoryFilters = (): MatchHistoryFilterState => ({
  sport: '',
  result: 'all',
  dateFrom: '',
  dateTo: '',
  sortOrder: 'newest_first',
});

/**
 * Placeholder until the API returns per-user match result on past games.
 * Stable per `gameId` so filters and list labels stay consistent.
 */
export function getMockMatchOutcome(gameId: string): 'win' | 'loss' {
  let h = 0;
  for (let i = 0; i < gameId.length; i++) {
    h = (Math.imul(31, h) + gameId.charCodeAt(i)) | 0;
  }
  return h % 2 === 0 ? 'win' : 'loss';
}

function parseDayStart(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function parseDayEnd(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function isGameInDateRange(isoStartTime: string, dateFrom: string, dateTo: string): boolean {
  const t = new Date(isoStartTime).getTime();
  if (dateFrom) {
    if (t < parseDayStart(dateFrom).getTime()) return false;
  }
  if (dateTo) {
    if (t > parseDayEnd(dateTo).getTime()) return false;
  }
  return true;
}

/** Client-side filters for past games (US-7.5 AC1). */
export function filterPastGamesForMatchHistory(
  games: GameResponse[],
  filters: MatchHistoryFilterState
): GameResponse[] {
  return games.filter((game) => {
    if (filters.sport && game.sportName !== filters.sport) {
      return false;
    }
    if (filters.result !== 'all') {
      if (getMockMatchOutcome(game.gameId) !== filters.result) {
        return false;
      }
    }
    if (!isGameInDateRange(game.startTime, filters.dateFrom, filters.dateTo)) {
      return false;
    }
    return true;
  });
}

export function uniqueSportNames(games: GameResponse[]): string[] {
  const set = new Set<string>();
  for (const g of games) {
    if (g.sportName?.trim()) set.add(g.sportName.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** US-7.5 AC2: sort by game start time (uses `startTime` ISO string). */
export function sortMatchHistoryGames(
  games: GameResponse[],
  order: MatchHistorySortOrder
): GameResponse[] {
  const sorted = [...games];
  sorted.sort((a, b) => {
    const ta = new Date(a.startTime).getTime();
    const tb = new Date(b.startTime).getTime();
    return order === 'newest_first' ? tb - ta : ta - tb;
  });
  return sorted;
}

/** US-7.5 AC3: venue / area label (respects privacy fields from API). */
export function getMatchHistoryVenueLabel(game: GameResponse): string {
  if (game.hasExactLocationAccess && game.location) {
    const parts = [game.location.name, game.location.city].filter(
      (p): p is string => Boolean(p?.trim())
    );
    return parts.length > 0 ? parts.join(' · ') : 'Venue TBD';
  }
  if (game.approximateLocation?.trim()) {
    return game.approximateLocation.trim();
  }
  return 'Location unavailable';
}

/** US-7.5 AC3: human-readable date/time; includes end time when present. */
export function formatMatchHistoryDateTime(game: GameResponse): string {
  const start = new Date(game.startTime);
  if (game.endTime) {
    const end = new Date(game.endTime);
    return `${format(start, 'EEE, MMM d, yyyy · h:mm a')} – ${format(end, 'h:mm a')}`;
  }
  return format(start, "EEEE, MMM d, yyyy 'at' h:mm a");
}

/**
 * Placeholder score line until the API returns final scores on past games.
 * Stable per `gameId` (same as filters / result mock).
 */
export function getMockMatchScoreDisplay(gameId: string): string {
  let h = 0;
  for (let i = 0; i < gameId.length; i++) {
    h = (Math.imul(31, h) + gameId.charCodeAt(i)) | 0;
  }
  const a = 8 + (Math.abs(h) % 25);
  const b = 8 + (Math.abs(h >> 5) % 25);
  return `${a} – ${b}`;
}
