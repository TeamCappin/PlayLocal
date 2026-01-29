import { act, renderHook, waitFor } from "@testing-library/react";
import { useGame, usePastGamesByUserNeedingAttendanceUpdate } from "./useGames";
import { gamesApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  gamesApi: {
    getById: jest.fn(),
    getRoster: jest.fn(),
    getPastByUserNeedingAttendanceUpdate: jest.fn(),
    getUpcoming: jest.fn(),
    getPast: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    create: jest.fn(),
  },
}));

const mockGetById = gamesApi.getById as jest.MockedFunction<
  typeof gamesApi.getById
>;
const mockGetRoster = gamesApi.getRoster as jest.MockedFunction<
  typeof gamesApi.getRoster
>;
const mockJoin = gamesApi.join as jest.MockedFunction<typeof gamesApi.join>;
const mockLeave = gamesApi.leave as jest.MockedFunction<typeof gamesApi.leave>;
const mockGetPastByUserNeedingAttendanceUpdate =
  gamesApi.getPastByUserNeedingAttendanceUpdate as jest.MockedFunction<
    typeof gamesApi.getPastByUserNeedingAttendanceUpdate
  >;

const mockGame = {
  gameId: "g1",
  title: "Test Game",
  sportName: "Basketball",
  startTime: "2025-02-01T10:00:00Z",
  location: { name: "Park" },
  skillBand: "Intermediate",
  intensityBand: "Competitive",
} as any;

const mockRoster = {
  confirmed: [
    {
      participationId: "p1",
      userId: "u1",
      displayName: "Alice",
      role: "PARTICIPANT",
      joinStatus: "CONFIRMED",
    },
  ],
  waitlisted: [],
  maxPlayers: 10,
  spotsAvailable: 9,
} as any;

describe("useGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not fetch when gameId is undefined", async () => {
    const { result } = renderHook(() => useGame(undefined));

    await waitFor(() => {
      expect(mockGetById).not.toHaveBeenCalled();
      expect(mockGetRoster).not.toHaveBeenCalled();
    });

    expect(result.current.game).toBeNull();
    expect(result.current.roster).toBeNull();
  });

  it("fetches game and roster on mount when gameId is set", async () => {
    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);

    const { result } = renderHook(() => useGame("game-123"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetById).toHaveBeenCalledWith("game-123");
    expect(mockGetRoster).toHaveBeenCalledWith("game-123");
    expect(result.current.game).toEqual(mockGame);
    expect(result.current.roster).toEqual(mockRoster);
    expect(result.current.error).toBeNull();
  });

  it("sets error when fetch fails", async () => {
    mockGetById.mockRejectedValue(new Error("Not found"));
    mockGetRoster.mockRejectedValue(new Error("Not found"));

    const { result } = renderHook(() => useGame("game-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load game");
    expect(result.current.game).toBeNull();
    expect(result.current.roster).toBeNull();
  });

  it("refetch loads game and roster again", async () => {
    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);

    const { result } = renderHook(() => useGame("game-123"));

    await waitFor(() => {
      expect(result.current.game).toEqual(mockGame);
    });

    const updatedGame = { ...mockGame, title: "Updated" };
    mockGetById.mockResolvedValue(updatedGame);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.game?.title).toBe("Updated");
    });
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("joinGame calls API and refetches game", async () => {
    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    mockJoin.mockResolvedValue({
      participationId: "p1",
      joinStatus: "CONFIRMED",
      waitlistPosition: null,
      message: "Joined",
    } as any);

    const { result } = renderHook(() => useGame("game-123"));

    await waitFor(() => {
      expect(result.current.game).toEqual(mockGame);
    });

    let joinResponse: any;
    await act(async () => {
      joinResponse = await result.current.joinGame();
    });

    expect(mockJoin).toHaveBeenCalledWith("game-123", undefined);
    expect(joinResponse.joinStatus).toBe("CONFIRMED");
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("joinGame throws when gameId is undefined", async () => {
    const { result } = renderHook(() => useGame(undefined));

    await expect(act(async () => result.current.joinGame())).rejects.toThrow(
      "Game ID required",
    );
    expect(mockJoin).not.toHaveBeenCalled();
  });

  it("leaveGame calls API and refetches game", async () => {
    mockGetById.mockResolvedValue(mockGame);
    mockGetRoster.mockResolvedValue(mockRoster);
    mockLeave.mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useGame("game-123"));

    await waitFor(() => {
      expect(result.current.game).toEqual(mockGame);
    });

    await act(async () => {
      await result.current.leaveGame();
    });

    expect(mockLeave).toHaveBeenCalledWith("game-123");
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("leaveGame throws when gameId is undefined", async () => {
    const { result } = renderHook(() => useGame(undefined));

    await expect(act(async () => result.current.leaveGame())).rejects.toThrow(
      "Game ID required",
    );
    expect(mockLeave).not.toHaveBeenCalled();
  });
});

describe("usePastGamesByUserNeedingAttendanceUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches games on mount", async () => {
    mockGetPastByUserNeedingAttendanceUpdate.mockResolvedValue([mockGame]);

    const { result } = renderHook(() =>
      usePastGamesByUserNeedingAttendanceUpdate(),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetPastByUserNeedingAttendanceUpdate).toHaveBeenCalled();
    expect(result.current.games).toEqual([mockGame]);
    expect(result.current.error).toBeNull();
  });

  it("returns empty list when no games need update", async () => {
    mockGetPastByUserNeedingAttendanceUpdate.mockResolvedValue([]);

    const { result } = renderHook(() =>
      usePastGamesByUserNeedingAttendanceUpdate(),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.games).toEqual([]);
  });

  it("sets error when fetch fails", async () => {
    mockGetPastByUserNeedingAttendanceUpdate.mockRejectedValue(
      new Error("Unauthorized"),
    );

    const { result } = renderHook(() =>
      usePastGamesByUserNeedingAttendanceUpdate(),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(
      "Failed to load past games needing attendance update",
    );
    expect(result.current.games).toEqual([]);
  });

  it("refetch reloads games", async () => {
    mockGetPastByUserNeedingAttendanceUpdate.mockResolvedValue([mockGame]);

    const { result } = renderHook(() =>
      usePastGamesByUserNeedingAttendanceUpdate(),
    );

    await waitFor(() => {
      expect(result.current.games).toHaveLength(1);
    });

    mockGetPastByUserNeedingAttendanceUpdate.mockResolvedValue([
      mockGame,
      { ...mockGame, gameId: "g2" } as any,
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

// Additional tests for useGames and usePastGames hooks
describe("useGames", () => {
  const mockGetUpcoming = gamesApi.getUpcoming as jest.MockedFunction<
    typeof gamesApi.getUpcoming
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches upcoming games on mount", async () => {
    mockGetUpcoming.mockResolvedValue([mockGame]);

    const { result } = renderHook(() => require("./useGames").useGames());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetUpcoming).toHaveBeenCalled();
    expect(result.current.games).toEqual([mockGame]);
    expect(result.current.error).toBeNull();
  });

  it("sets error when fetch fails", async () => {
    mockGetUpcoming.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => require("./useGames").useGames());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load games");
    expect(result.current.games).toEqual([]);
  });

  it("refetch reloads games", async () => {
    mockGetUpcoming.mockResolvedValue([mockGame]);

    const { result } = renderHook(() => require("./useGames").useGames());

    await waitFor(() => {
      expect(result.current.games).toHaveLength(1);
    });

    mockGetUpcoming.mockResolvedValue([
      mockGame,
      { ...mockGame, gameId: "g2" } as any,
    ]);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.games).toHaveLength(2);
    });
    expect(mockGetUpcoming).toHaveBeenCalledTimes(2);
  });
});

describe("usePastGames", () => {
  const mockGetPast = gamesApi.getPast as jest.MockedFunction<
    typeof gamesApi.getPast
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches past games on mount", async () => {
    mockGetPast.mockResolvedValue([mockGame]);

    const { result } = renderHook(() => require("./useGames").usePastGames());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetPast).toHaveBeenCalled();
    expect(result.current.games).toEqual([mockGame]);
    expect(result.current.error).toBeNull();
  });

  it("sets error when fetch fails", async () => {
    mockGetPast.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => require("./useGames").usePastGames());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load past games");
    expect(result.current.games).toEqual([]);
  });

  it("refetch reloads past games", async () => {
    mockGetPast.mockResolvedValue([mockGame]);

    const { result } = renderHook(() => require("./useGames").usePastGames());

    await waitFor(() => {
      expect(result.current.games).toHaveLength(1);
    });

    mockGetPast.mockResolvedValue([
      mockGame,
      { ...mockGame, gameId: "g3" } as any,
    ]);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.games).toHaveLength(2);
    });
    expect(mockGetPast).toHaveBeenCalledTimes(2);
  });
});

describe("useCreateGame", () => {
  const mockCreate = gamesApi.create as jest.MockedFunction<
    typeof gamesApi.create
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockClear();
  });

  it("creates a game successfully", async () => {
    const gameData = {
      title: "New Game",
      sportName: "Basketball",
      startTime: "2025-02-01T10:00:00Z",
      maxPlayers: 10,
    } as any;

    mockCreate.mockResolvedValue(mockGame);

    const { result } = renderHook(() => require("./useGames").useCreateGame());

    expect(result.current.isCreating).toBe(false);

    let createdGame: any;
    await act(async () => {
      createdGame = await result.current.createGame(gameData);
    });

    expect(mockCreate).toHaveBeenCalledWith(gameData);
    expect(createdGame).toEqual(mockGame);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error when create fails", async () => {
    const gameData = {
      title: "New Game",
      sportName: "Basketball",
    } as any;

    mockCreate.mockRejectedValue(new Error("Validation error"));

    const { result } = renderHook(() => require("./useGames").useCreateGame());

    let error: any;
    await act(async () => {
      try {
        await result.current.createGame(gameData);
      } catch (e) {
        error = e;
      }
    });

    expect(error).toBeDefined();
    expect(result.current.error).toBe("Failed to create game");
    expect(result.current.isCreating).toBe(false);
  });
});
