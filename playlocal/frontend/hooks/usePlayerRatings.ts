import { useState, useCallback, useEffect } from 'react';
import { playerRatingsApi, CreatePlayerRatingRequest, UpdatePlayerRatingRequest, PlayerRatingResponse } from '@/lib/api';
import { toast, getActionableErrorMessage } from '@/lib/toast';

export function usePlayerRatings() {
  const [isLoading, setIsLoading] = useState(false);

  const createRating = useCallback(async (data: CreatePlayerRatingRequest) => {
    setIsLoading(true);
    try {
      const response = await playerRatingsApi.createRating(data);
      toast.success('Rating submitted successfully');
      return response;
    } catch (error) {
      toast.error(getActionableErrorMessage(error, 'submit rating'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRating = useCallback(async (ratingId: string, data: UpdatePlayerRatingRequest) => {
    setIsLoading(true);
    try {
      const response = await playerRatingsApi.updateRating(ratingId, data);
      toast.success('Rating updated successfully');
      return response;
    } catch (error) {
      toast.error(getActionableErrorMessage(error, 'update rating'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const flagRating = useCallback(async (ratingId: string) => {
    setIsLoading(true);
    try {
      await playerRatingsApi.flagRating(ratingId);
      toast.success('Rating has been reported for moderation');
    } catch (error) {
      toast.error(getActionableErrorMessage(error, 'report rating'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createRating,
    updateRating,
    flagRating,
    isLoading
  };
}

export function useUserRatings(userId: string) {
  const [ratings, setRatings] = useState<PlayerRatingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  const fetchRatings = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await playerRatingsApi.getRatingsForUser(userId);
      setRatings(data);
    } catch {
      setError('Failed to load user ratings');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return {
    ratings,
    isLoading,
    error,
    refresh: fetchRatings,
  };
}