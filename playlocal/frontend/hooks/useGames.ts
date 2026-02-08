import { useState, useEffect, useCallback } from "react";
import {
  gamesApi,
  GameResponse,
  RosterResponse,
  JoinResponse,
  GameFilters
} from "@/lib/api";

export function useGames(filters?: GameFilters) {
    const [games, setGames] = useState<GameResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGames = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!gamesApi || typeof gamesApi.getUpcoming !== 'function') {
                throw new Error('gamesApi.getUpcoming is not available');
            }
            const data = await gamesApi.getUpcoming(filters);
            setGames(data || []);
        } catch (err) {
            setError("Failed to load games");
            console.error("Error fetching games:", err);
            setGames([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    return { games, isLoading, error, refetch: fetchGames };
}

export function usePastGames() {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!gamesApi || typeof gamesApi.getPast !== 'function') {
        throw new Error('gamesApi.getPast is not available');
      }
      const data = await gamesApi.getPast();
      setGames(data || []);
    } catch (err) {
      setError("Failed to load past games");
      console.error("Error fetching past games:", err);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { games, isLoading, error, refetch: fetchGames };
}

export function usePastGamesByUserNeedingAttendanceUpdate() {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!gamesApi || typeof gamesApi.getPastByUserNeedingAttendanceUpdate !== 'function') {
        throw new Error('gamesApi.getPastByUserNeedingAttendanceUpdate is not available');
      }
      const data = await gamesApi.getPastByUserNeedingAttendanceUpdate();
      setGames(data || []);
    } catch (err) {
      setError("Failed to load past games needing attendance update");
      console.error(
        "Error fetching past games needing attendance update:",
        err,
      );
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { games, isLoading, error, refetch: fetchGames };
}

export function useGame(gameId: string | undefined) {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    setIsLoading(true);
    setError(null);
    try {
      if (!gamesApi || typeof gamesApi.getById !== 'function' || typeof gamesApi.getRoster !== 'function') {
        throw new Error('gamesApi methods are not available');
      }
      const [gameData, rosterData] = await Promise.all([
        gamesApi.getById(gameId),
        gamesApi.getRoster(gameId),
      ]);
      setGame(gameData || null);
      setRoster(rosterData || null);
    } catch (err) {
      setError("Failed to load game");
      console.error("Error fetching game:", err);
      setGame(null);
      setRoster(null);
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  const joinGame = async (
    confirmedTagIds?: string[],
  ): Promise<JoinResponse> => {
    if (!gameId) throw new Error("Game ID required");
    if (!gamesApi || typeof gamesApi.join !== 'function') {
      throw new Error('gamesApi.join is not available');
    }
    const response = await gamesApi.join(
      gameId,
      confirmedTagIds ? { confirmedTagIds } : undefined,
    );
    await fetchGame(); // Refresh data
    return response;
  };

  const leaveGame = async (): Promise<void> => {
    if (!gameId) throw new Error("Game ID required");
    if (!gamesApi || typeof gamesApi.leave !== 'function') {
      throw new Error('gamesApi.leave is not available');
    }
    await gamesApi.leave(gameId);
    await fetchGame(); // Refresh data
  };

  const cancelGame = async (): Promise<GameResponse> => {
    if (!gameId) throw new Error('Game ID required');
    if (!gamesApi || typeof gamesApi.cancel !== 'function') {
      throw new Error('gamesApi.cancel is not available');
    }
    const response = await gamesApi.cancel(gameId);
    await fetchGame(); // Refresh data
    return response;
  };

  const completeGame = async (): Promise<GameResponse> => {
    if (!gameId) throw new Error('Game ID required');
    if (!gamesApi || typeof gamesApi.complete !== 'function') {
      throw new Error('gamesApi.complete is not available');
    }
    const response = await gamesApi.complete(gameId);
    await fetchGame(); // Refresh data
    return response;
  };

  const archiveGame = async (): Promise<GameResponse> => {
    if (!gameId) throw new Error('Game ID required');
    if (!gamesApi || typeof gamesApi.archive !== 'function') {
      throw new Error('gamesApi.archive is not available');
    }
    const response = await gamesApi.archive(gameId);
    await fetchGame(); // Refresh data
    return response;
  };

  return {
    game,
    roster,
    isLoading,
    error,
    refetch: fetchGame,
    joinGame,
    leaveGame,
    cancelGame,
    completeGame,
    archiveGame,
  };
}

export function useCreateGame() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async (data: Parameters<typeof gamesApi.create>[0]) => {
    setIsCreating(true);
    setError(null);
    try {
      if (!gamesApi || typeof gamesApi.create !== 'function') {
        throw new Error('gamesApi.create is not available');
      }
      const game = await gamesApi.create(data);
      return game;
    } catch (err) {
      setError("Failed to create game");
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { createGame, isCreating, error };
}
