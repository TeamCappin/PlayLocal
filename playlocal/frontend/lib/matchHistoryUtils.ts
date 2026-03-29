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
