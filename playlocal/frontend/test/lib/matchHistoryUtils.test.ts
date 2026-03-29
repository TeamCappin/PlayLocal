import {
  clearMatchHistoryFilterFields,
  defaultMatchHistoryFilters,
  filterPastGamesForMatchHistory,
  formatMatchHistoryDateTime,
  getMatchHistoryVenueLabel,
  getMockMatchOutcome,
  getMockMatchScoreDisplay,
  hasActiveMatchHistoryFilters,
  sortMatchHistoryGames,
  uniqueSportNames,
} from '@/lib/matchHistoryUtils';
import type { GameResponse } from '@/lib/api';

function game(partial: Partial<GameResponse> & Pick<GameResponse, 'gameId'>): GameResponse {
  return {
    title: 'T',
    sportName: 'Basketball',
    location: { name: 'L' },
    minPlayers: 2,
    maxPlayers: 10,
    allowWaitlist: false,
    startTime: '2025-06-15T18:00:00Z',
    status: 'COMPLETED',
    organizer: {
      userId: 'o1',
      displayName: 'Org',
    },
    confirmedCount: 5,
    waitlistCount: 0,
    createdAt: '2025-01-01T00:00:00Z',
    hasExactLocationAccess: true,
    ...partial,
  };
}

describe('matchHistoryUtils', () => {
  it('hasActiveMatchHistoryFilters ignores sort only', () => {
    expect(hasActiveMatchHistoryFilters(defaultMatchHistoryFilters())).toBe(
      false
    );
    expect(
      hasActiveMatchHistoryFilters({
        ...defaultMatchHistoryFilters(),
        sortOrder: 'oldest_first',
      })
    ).toBe(false);
    expect(
      hasActiveMatchHistoryFilters({
        ...defaultMatchHistoryFilters(),
        sport: 'Soccer',
      })
    ).toBe(true);
  });

  it('clearMatchHistoryFilterFields preserves sortOrder', () => {
    const cleared = clearMatchHistoryFilterFields({
      sport: 'Soccer',
      result: 'win',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      sortOrder: 'oldest_first',
    });
    expect(cleared).toEqual({
      sport: '',
      result: 'all',
      dateFrom: '',
      dateTo: '',
      sortOrder: 'oldest_first',
    });
  });

  it('getMockMatchOutcome is stable per gameId', () => {
    expect(getMockMatchOutcome('abc')).toBe(getMockMatchOutcome('abc'));
    expect(['win', 'loss']).toContain(getMockMatchOutcome('x'));
  });

  it('getMockMatchScoreDisplay is stable per gameId', () => {
    expect(getMockMatchScoreDisplay('abc')).toBe(getMockMatchScoreDisplay('abc'));
    expect(getMockMatchScoreDisplay('x')).toMatch(/^\d+ – \d+$/);
  });

  it('getMatchHistoryVenueLabel uses exact location when allowed', () => {
    expect(
      getMatchHistoryVenueLabel(
        game({
          gameId: '1',
          hasExactLocationAccess: true,
          location: { name: 'Court A', city: 'Boston' },
        })
      )
    ).toBe('Court A · Boston');
    expect(
      getMatchHistoryVenueLabel(
        game({ gameId: '2', hasExactLocationAccess: true, location: { name: 'Court A' } })
      )
    ).toBe('Court A');
  });

  it('getMatchHistoryVenueLabel falls back to approximate or unavailable', () => {
    expect(
      getMatchHistoryVenueLabel(
        game({
          gameId: '3',
          hasExactLocationAccess: false,
          approximateLocation: 'North side',
        })
      )
    ).toBe('North side');
    expect(
      getMatchHistoryVenueLabel(
        game({ gameId: '4', hasExactLocationAccess: false, location: { name: 'Hidden' } })
      )
    ).toBe('Location unavailable');
  });

  it('formatMatchHistoryDateTime includes range when endTime present', () => {
    expect(
      formatMatchHistoryDateTime(
        game({
          gameId: 'e',
          startTime: '2025-06-15T18:00:00Z',
          endTime: '2025-06-15T19:30:00Z',
        })
      )
    ).toMatch(/Jun 15, 2025/);
    expect(
      formatMatchHistoryDateTime(
        game({
          gameId: 'e',
          startTime: '2025-06-15T18:00:00Z',
          endTime: '2025-06-15T19:30:00Z',
        })
      )
    ).toContain('–');
  });

  it('formatMatchHistoryDateTime single stamp without endTime', () => {
    const s = formatMatchHistoryDateTime(
      game({ gameId: 'f', startTime: '2025-06-15T18:00:00Z' })
    );
    expect(s).toMatch(/Jun 15, 2025/);
    expect(s).toContain('at');
  });

  it('filters by sport', () => {
    const games = [
      game({ gameId: '1', sportName: 'Soccer' }),
      game({ gameId: '2', sportName: 'Basketball' }),
    ];
    const out = filterPastGamesForMatchHistory(games, {
      ...defaultMatchHistoryFilters(),
      sport: 'Soccer',
    });
    expect(out).toHaveLength(1);
    expect(out[0].gameId).toBe('1');
  });

  it('filters by result using mock outcome', () => {
    const games = [
      game({ gameId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }),
      game({ gameId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }),
    ];
    const w = getMockMatchOutcome(games[0].gameId);
    const filtered = filterPastGamesForMatchHistory(games, {
      ...defaultMatchHistoryFilters(),
      result: w,
    });
    expect(filtered.every((g) => getMockMatchOutcome(g.gameId) === w)).toBe(true);
  });

  it('filters by date range', () => {
    const games = [
      game({ gameId: '1', startTime: '2025-01-10T12:00:00Z' }),
      game({ gameId: '2', startTime: '2025-03-20T12:00:00Z' }),
    ];
    const out = filterPastGamesForMatchHistory(games, {
      ...defaultMatchHistoryFilters(),
      dateFrom: '2025-02-01',
      dateTo: '2025-12-31',
    });
    expect(out.map((g) => g.gameId)).toEqual(['2']);
  });

  it('uniqueSportNames sorts', () => {
    const games = [
      game({ gameId: '1', sportName: 'Zebra Sport' }),
      game({ gameId: '2', sportName: 'Alpha Sport' }),
    ];
    expect(uniqueSportNames(games)).toEqual(['Alpha Sport', 'Zebra Sport']);
  });

  it('sortMatchHistoryGames newest_first orders by startTime descending', () => {
    const games = [
      game({ gameId: 'a', startTime: '2025-01-01T12:00:00Z' }),
      game({ gameId: 'b', startTime: '2025-06-01T12:00:00Z' }),
      game({ gameId: 'c', startTime: '2025-03-01T12:00:00Z' }),
    ];
    const sorted = sortMatchHistoryGames(games, 'newest_first');
    expect(sorted.map((g) => g.gameId)).toEqual(['b', 'c', 'a']);
  });

  it('sortMatchHistoryGames oldest_first orders by startTime ascending', () => {
    const games = [
      game({ gameId: 'a', startTime: '2025-01-01T12:00:00Z' }),
      game({ gameId: 'b', startTime: '2025-06-01T12:00:00Z' }),
    ];
    const sorted = sortMatchHistoryGames(games, 'oldest_first');
    expect(sorted.map((g) => g.gameId)).toEqual(['a', 'b']);
  });
});
