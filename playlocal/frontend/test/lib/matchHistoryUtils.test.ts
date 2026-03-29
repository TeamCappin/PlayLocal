import {
  filterPastGamesForMatchHistory,
  getMockMatchOutcome,
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
  it('getMockMatchOutcome is stable per gameId', () => {
    expect(getMockMatchOutcome('abc')).toBe(getMockMatchOutcome('abc'));
    expect(['win', 'loss']).toContain(getMockMatchOutcome('x'));
  });

  it('filters by sport', () => {
    const games = [
      game({ gameId: '1', sportName: 'Soccer' }),
      game({ gameId: '2', sportName: 'Basketball' }),
    ];
    const out = filterPastGamesForMatchHistory(games, {
      sport: 'Soccer',
      result: 'all',
      dateFrom: '',
      dateTo: '',
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
      sport: '',
      result: w,
      dateFrom: '',
      dateTo: '',
    });
    expect(filtered.every((g) => getMockMatchOutcome(g.gameId) === w)).toBe(true);
  });

  it('filters by date range', () => {
    const games = [
      game({ gameId: '1', startTime: '2025-01-10T12:00:00Z' }),
      game({ gameId: '2', startTime: '2025-03-20T12:00:00Z' }),
    ];
    const out = filterPastGamesForMatchHistory(games, {
      sport: '',
      result: 'all',
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
});
