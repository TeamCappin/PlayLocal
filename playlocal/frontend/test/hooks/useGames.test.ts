import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useGame,
  usePastGamesByUserNeedingAttendanceUpdate,
} from '../../hooks/useGames';
import { gamesApi } from '@/lib/api';

jest.mock('@/lib/api', () => {
  const mockFn = jest.fn(() => Promise.resolve({}));
  return {
    gamesApi: {
      getById: jest.fn(),
      getRoster: jest.fn(),
      getPastByUserNeedingAttendanceUpdate: jest.fn(),
      getUpcoming: jest.fn(),
      getPast: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      create: jest.fn(),
      cancel: jest.fn(),
      complete: jest.fn(),
      archive: jest.fn(),
      getGameParticipation: jest.fn(),
    },
    organizerQualityApi: {
      getOqs: mockFn,
      getMyOqs: mockFn,
      getOqsSummary: mockFn,
      getOqsInfoCard: mockFn,
      getMyOqsInfoCard: mockFn,
      getOqsHistory: mockFn,
      getMyOqsHistory: mockFn,
      getWeights: mockFn,
    },
    attendanceApi: {},
    reportsApi: {},
    notificationsApi: {},
    endorsementsApi: {},
    healthApi: {},
    authApi: {},
    scoreHistoryApi: {},
  };
});

const hooksPath = '../../hooks/useGames';

const mockGetById = gamesApi.getById as jest.MockedFunction<
  typeof gamesApi.getById
>;
const mockGetRoster = gamesApi.getRoster as jest.MockedFunction<
  typeof gamesApi.getRoster
>;
const mockJoin = gamesApi.join as jest.MockedFunction<typeof gamesApi.join>;
const mockLeave = gamesApi.leave as jest.MockedFunction<typeof gamesApi.leave>;
const mockComplete = gamesApi.complete as jest.MockedFunction<
  typeof gamesApi.complete
>;
const mockArchive = gamesApi.archive as jest.MockedFunction<
  typeof gamesApi.archive
>;
const mockGetPastByUserNeedingAttendanceUpdate =
  gamesApi.getPastByUserNeedingAttendanceUpdate as jest.MockedFunction<
    typeof gamesApi.getPastByUserNeedingAttendanceUpdate
  >;

const mockGame = {
  gameId: 'g1',
  title: 'Test Game',
  sportName: 'Basketball',
  startTime: '2025-02-01T10:00:00Z',
  location: { name: 'Park' },
  skillBand: 'Intermediate',
  intensityBand: 'Competitive',
} as any;

const mockRoster = {
  confirmed: [
    {
      participationId: 'p1',
      userId: 'u1',
      displayName: 'Alice',
      role: 'PARTICIPANT',
      joinStatus: 'CONFIRMED',
    },
  ],
  waitlisted: [],
  maxPlayers: 10,
  spotsAvailable: 9,
} as any;

describe('useGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when gameId is undefined', async () => {
    const { result } = renderHook(() => useGame(undefined));

    await waitFor(() => {
      expect(mockGetById).not.toHaveBeenCalled();
      expect(mockGetRoster).not.toHaveBeenCalled();
    });

    expect(result.current.game).toBeNull();
    expect(result.current.roster).toBeNull();
  });

  it('fetches game and roster on mount when gameId is set', async () => {
    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);

    const { result } = renderHook(() => useGame('game-123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetById).toHaveBeenCalledWith('game-123');
    expect(mockGetRoster).toHaveBeenCalledWith('game-123');
    expect(result.current.game).toEqual(mockGame);
    expect(result.current.roster).toEqual(mockRoster);
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    mockGetById.mockRejectedValue(new Error('Not found'));
    mockGetRoster.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useGame('game-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load game');
    expect(result.current.game).toBeNull();
    expect(result.current.roster).toBeNull();
  });

  it('refetch loads game and roster again', async () => {
    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);

    const { result } = renderHook(() => useGame('game-123'));

    await waitFor(() => {
      expect(result.current.game).toEqual(mockGame);
    });

    const updatedGame = { ...mockGame, title: 'Updated' };
    mockGetById.mockResolvedValue(updatedGame);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.game?.title).toBe('Updated');
    });
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it('joinGame calls API and refetches game', async () => {
    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    mockJoin.mockResolvedValue({
      participationId: 'p1',
      joinStatus: 'CONFIRMED',
      waitlistPosition: null,
      message: 'Joined',
    } as any);

    const { result } = renderHook(() => useGame('game-123'));

    await waitFor(() => {
      expect(result.current.game).toEqual(mockGame);
    });

    let joinResponse: any;
    await act(async () => {
      joinResponse = await result.current.joinGame();
    });

    expect(mockJoin).toHaveBeenCalledWith('game-123', undefined);
    expect(joinResponse.joinStatus).toBe('CONFIRMED');
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it('joinGame throws when gameId is undefined', async () => {
    const { result } = renderHook(() => useGame(undefined));

    await expect(act(async () => result.current.joinGame())).rejects.toThrow(
      'Game ID required'
    );
    expect(mockJoin).not.toHaveBeenCalled();
  });

  it('leaveGame calls API and refetches game', async () => {
    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    mockLeave.mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useGame('game-123'));

    await waitFor(() => {
      expect(result.current.game).toEqual(mockGame);
    });

    await act(async () => {
      await result.current.leaveGame();
    });

    expect(mockLeave).toHaveBeenCalledWith('game-123');
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it('leaveGame skips refetch when refetchAfter is false', async () => {
    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    mockLeave.mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useGame('game-123'));

    await waitFor(() => {
      expect(result.current.game).toEqual(mockGame);
    });

    await act(async () => {
      await result.current.leaveGame({ refetchAfter: false });
    });

    expect(mockLeave).toHaveBeenCalledWith('game-123');
    expect(mockGetById).toHaveBeenCalledTimes(1);
  });

  it('leaveGame throws when gameId is undefined', async () => {
    const { result } = renderHook(() => useGame(undefined));

    await expect(act(async () => result.current.leaveGame())).rejects.toThrow(
      'Game ID required'
    );
    expect(mockLeave).not.toHaveBeenCalled();
  });
});

describe('usePastGamesByUserNeedingAttendanceUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches games on mount', async () => {
    mockGetPastByUserNeedingAttendanceUpdate.mockResolvedValue([mockGame]);

    const { result } = renderHook(() =>
      usePastGamesByUserNeedingAttendanceUpdate()
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetPastByUserNeedingAttendanceUpdate).toHaveBeenCalled();
    expect(result.current.games).toEqual([mockGame]);
    expect(result.current.error).toBeNull();
  });

  it('returns empty list when no games need update', async () => {
    mockGetPastByUserNeedingAttendanceUpdate.mockResolvedValue([]);

    const { result } = renderHook(() =>
      usePastGamesByUserNeedingAttendanceUpdate()
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.games).toEqual([]);
  });

  it('sets error when fetch fails', async () => {
    mockGetPastByUserNeedingAttendanceUpdate.mockRejectedValue(
      new Error('Unauthorized')
    );

    const { result } = renderHook(() =>
      usePastGamesByUserNeedingAttendanceUpdate()
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(
      'Failed to load past games needing attendance update'
    );
    expect(result.current.games).toEqual([]);
  });

  it('refetch reloads games', async () => {
    mockGetPastByUserNeedingAttendanceUpdate.mockResolvedValue([mockGame]);

    const { result } = renderHook(() =>
      usePastGamesByUserNeedingAttendanceUpdate()
    );

    await waitFor(() => {
      expect(result.current.games).toHaveLength(1);
    });

    mockGetPastByUserNeedingAttendanceUpdate.mockResolvedValue([
      mockGame,
      { ...mockGame, gameId: 'g2' } as any,
    ]);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.games).toHaveLength(2);
    });
    expect(mockGetPastByUserNeedingAttendanceUpdate).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------
// useGames
// ---------------------------------------------
describe('useGames', () => {
  const mockGetUpcoming = gamesApi.getUpcoming as jest.MockedFunction<
    typeof gamesApi.getUpcoming
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches upcoming games on mount', async () => {
    // Arrange
    mockGetUpcoming.mockResolvedValue([mockGame] as any);

    // Act
    const { result } = renderHook(() => require(hooksPath).useGames());

    // Assert
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetUpcoming).toHaveBeenCalledTimes(1);
    // hook calls getUpcoming(filters) where filters is undefined
    expect(mockGetUpcoming).toHaveBeenCalledWith(undefined);

    expect(result.current.games).toEqual([mockGame]);
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    // Arrange
    mockGetUpcoming.mockRejectedValue(new Error('Network error'));

    // Act
    const { result } = renderHook(() => require(hooksPath).useGames());

    // Assert
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Failed to load games');
    expect(result.current.games).toEqual([]);
  });

  it('refetch reloads games', async () => {
    // Arrange
    mockGetUpcoming.mockResolvedValue([mockGame] as any);

    const { result } = renderHook(() => require(hooksPath).useGames());

    await waitFor(() => expect(result.current.games).toHaveLength(1));

    mockGetUpcoming.mockResolvedValue([
      mockGame,
      { ...mockGame, gameId: 'g2' } as any,
    ]);

    // Act
    await act(async () => {
      await result.current.refetch(); // ✅ await the async refetch
    });

    // Assert
    await waitFor(() => expect(result.current.games).toHaveLength(2));
    expect(mockGetUpcoming).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------
// usePastGames
// ---------------------------------------------
describe('usePastGames', () => {
  const mockGetPast = gamesApi.getPast as jest.MockedFunction<
    typeof gamesApi.getPast
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches past games on mount', async () => {
    // Arrange
    mockGetPast.mockResolvedValue([mockGame] as any);

    // Act
    const { result } = renderHook(() => require(hooksPath).usePastGames());

    // Assert
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetPast).toHaveBeenCalledTimes(1);
    expect(result.current.games).toEqual([mockGame]);
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    // Arrange
    mockGetPast.mockRejectedValue(new Error('Server error'));

    // Act
    const { result } = renderHook(() => require(hooksPath).usePastGames());

    // Assert
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Failed to load past games');
    expect(result.current.games).toEqual([]);
  });

  it('refetch reloads past games', async () => {
    // Arrange
    mockGetPast.mockResolvedValue([mockGame] as any);

    const { result } = renderHook(() => require(hooksPath).usePastGames());

    await waitFor(() => expect(result.current.games).toHaveLength(1));

    mockGetPast.mockResolvedValue([
      mockGame,
      { ...mockGame, gameId: 'g3' } as any,
    ]);

    // Act
    await act(async () => {
      await result.current.refetch(); // ✅ await
    });

    // Assert
    await waitFor(() => expect(result.current.games).toHaveLength(2));
    expect(mockGetPast).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------
// useCreateGame
// ---------------------------------------------
describe('useCreateGame', () => {
  const mockCreate = gamesApi.create as jest.MockedFunction<
    typeof gamesApi.create
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a game successfully', async () => {
    // Arrange
    const gameData = {
      title: 'New Game',
      sportName: 'Basketball',
      startTime: '2025-02-01T10:00:00Z',
      maxPlayers: 10,
    } as any;

    mockCreate.mockResolvedValue(mockGame as any);

    const { result } = renderHook(() => require(hooksPath).useCreateGame());
    expect(result.current.isCreating).toBe(false);

    // Act
    let createdGame: any;
    await act(async () => {
      createdGame = await result.current.createGame(gameData);
    });

    // Assert
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(gameData);
    expect(createdGame).toEqual(mockGame);

    await waitFor(() => expect(result.current.isCreating).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('sets error from error message when create fails', async () => {
    // Arrange
    const gameData = { title: 'New Game', sportName: 'Basketball' } as any;
    mockCreate.mockRejectedValue(
      new Error('Start time must be in the future')
    );

    const { result } = renderHook(() => require(hooksPath).useCreateGame());

    // Act
    await act(async () => {
      await expect(result.current.createGame(gameData)).rejects.toBeDefined();
    });

    // Assert — now uses the actual error message instead of a hardcoded string
    expect(result.current.error).toBe('Start time must be in the future');
    await waitFor(() => expect(result.current.isCreating).toBe(false));
  });

  it('falls back to default error when error has no message', async () => {
    // Arrange
    const gameData = { title: 'New Game', sportName: 'Basketball' } as any;
    const err = new Error();
    err.message = '';
    mockCreate.mockRejectedValue(err);

    const { result } = renderHook(() => require(hooksPath).useCreateGame());

    // Act
    await act(async () => {
      await expect(result.current.createGame(gameData)).rejects.toBeDefined();
    });

    // Assert — falls back to default
    expect(result.current.error).toBe('Failed to create game');
    await waitFor(() => expect(result.current.isCreating).toBe(false));
  });
});

describe('useGame - cancelGame', () => {
  const mockCancel = gamesApi.cancel as jest.MockedFunction<
    typeof gamesApi.cancel
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCancel.mockClear();
  });

  it('cancels a game successfully and refreshes data', async () => {
    const gameId = 'game-123';
    const cancelledGame = {
      ...mockGame,
      gameId,
      status: 'CANCELLED',
    } as any;

    // Mock initial fetch
    mockGetById.mockResolvedValueOnce(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    // Mock cancel response
    mockCancel.mockResolvedValue(cancelledGame);
    // Mock refresh after cancel
    mockGetById.mockResolvedValueOnce(cancelledGame);

    const { result } = renderHook(() => useGame(gameId));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.game).toBeDefined();
    });

    // Cancel the game
    await act(async () => {
      await result.current.cancelGame();
    });

    // Verify cancel was called
    expect(mockCancel).toHaveBeenCalledWith(gameId);
    // Verify game was refreshed (called twice: initial + after cancel)
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it('cancels a game without refetch when refetchAfter is false', async () => {
    const gameId = 'game-123';
    const cancelledGame = {
      ...mockGame,
      gameId,
      status: 'CANCELLED',
    } as any;

    mockGetById.mockResolvedValueOnce(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    mockCancel.mockResolvedValue(cancelledGame);

    const { result } = renderHook(() => useGame(gameId));

    await waitFor(() => {
      expect(result.current.game).toBeDefined();
    });

    await act(async () => {
      await result.current.cancelGame({ refetchAfter: false });
    });

    expect(mockCancel).toHaveBeenCalledWith(gameId);
    expect(mockGetById).toHaveBeenCalledTimes(1);
  });

  it('throws error when gameId is missing', async () => {
    const { result } = renderHook(() => useGame(null as any));

    await expect(async () => {
      await result.current.cancelGame();
    }).rejects.toThrow('Game ID required');
  });

  it('handles cancel failure gracefully', async () => {
    const gameId = 'game-456';

    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    mockCancel.mockRejectedValue(new Error('Not authorized'));

    const { result } = renderHook(() => useGame(gameId));

    await waitFor(() => {
      expect(result.current.game).toBeDefined();
    });

    await expect(async () => {
      await result.current.cancelGame();
    }).rejects.toThrow('Not authorized');

    expect(mockCancel).toHaveBeenCalledWith(gameId);
  });
});

describe('useGame - completeGame and archiveGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockComplete.mockClear();
    mockArchive.mockClear();
  });

  it('completes a game successfully and refreshes data', async () => {
    const gameId = 'game-789';
    const completedGame = {
      ...mockGame,
      gameId,
      status: 'COMPLETED',
    } as any;

    mockGetById.mockResolvedValueOnce(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    mockComplete.mockResolvedValue(completedGame);
    mockGetById.mockResolvedValueOnce(completedGame);

    const { result } = renderHook(() => useGame(gameId));

    await waitFor(() => {
      expect(result.current.game).toBeDefined();
    });

    await act(async () => {
      await result.current.completeGame();
    });

    expect(mockComplete).toHaveBeenCalledWith(gameId);
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it('archives a game successfully and refreshes data', async () => {
    const gameId = 'game-900';
    const archivedGame = {
      ...mockGame,
      gameId,
      status: 'ARCHIVED',
    } as any;

    mockGetById.mockResolvedValueOnce(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    mockArchive.mockResolvedValue(archivedGame);
    mockGetById.mockResolvedValueOnce(archivedGame);

    const { result } = renderHook(() => useGame(gameId));

    await waitFor(() => {
      expect(result.current.game).toBeDefined();
    });

    await act(async () => {
      await result.current.archiveGame();
    });

    expect(mockArchive).toHaveBeenCalledWith(gameId);
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it('completeGame throws when gamesApi.complete is unavailable', async () => {
    const gameId = 'game-901';
    const originalComplete = (gamesApi as any).complete;
    (gamesApi as any).complete = undefined;

    try {
      const { result } = renderHook(() => useGame(gameId));

      await expect(async () => {
        await result.current.completeGame();
      }).rejects.toThrow('gamesApi.complete is not available');
    } finally {
      (gamesApi as any).complete = originalComplete;
    }
  });

  it('archiveGame throws when gamesApi.archive is unavailable', async () => {
    const gameId = 'game-902';
    const originalArchive = (gamesApi as any).archive;
    (gamesApi as any).archive = undefined;

    try {
      const { result } = renderHook(() => useGame(gameId));

      await expect(async () => {
        await result.current.archiveGame();
      }).rejects.toThrow('gamesApi.archive is not available');
    } finally {
      (gamesApi as any).archive = originalArchive;
    }
  });
});
