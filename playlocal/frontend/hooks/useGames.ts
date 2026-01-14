import { useState, useEffect, useCallback } from 'react';
import { gamesApi, GameResponse, RosterResponse, JoinResponse } from '@/lib/api';

export function useGames() {
    const [games, setGames] = useState<GameResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGames = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await gamesApi.getUpcoming();
            setGames(data);
        } catch (err) {
            setError('Failed to load games');
            console.error('Error fetching games:', err);
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
            const [gameData, rosterData] = await Promise.all([
                gamesApi.getById(gameId),
                gamesApi.getRoster(gameId),
            ]);
            setGame(gameData);
            setRoster(rosterData);
        } catch (err) {
            setError('Failed to load game');
            console.error('Error fetching game:', err);
        } finally {
            setIsLoading(false);
        }
    }, [gameId]);

    useEffect(() => {
        fetchGame();
    }, [fetchGame]);

    const joinGame = async (): Promise<JoinResponse> => {
        if (!gameId) throw new Error('Game ID required');
        const response = await gamesApi.join(gameId);
        await fetchGame(); // Refresh data
        return response;
    };

    const leaveGame = async (): Promise<void> => {
        if (!gameId) throw new Error('Game ID required');
        await gamesApi.leave(gameId);
        await fetchGame(); // Refresh data
    };

    const cancelGame = async (): Promise<GameResponse> => {
        if (!gameId) throw new Error('Game ID required');
        const response = await gamesApi.cancel(gameId);
        await fetchGame(); // Refresh data
        return response;
    };

    return { game, roster, isLoading, error, refetch: fetchGame, joinGame, leaveGame, cancelGame };
}

export function useCreateGame() {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createGame = async (data: Parameters<typeof gamesApi.create>[0]) => {
        setIsCreating(true);
        setError(null);
        try {
            const game = await gamesApi.create(data);
            return game;
        } catch (err) {
            setError('Failed to create game');
            throw err;
        } finally {
            setIsCreating(false);
        }
    };

    return { createGame, isCreating, error };
}
