import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlayerRatings, useUserRatings } from '@/hooks/usePlayerRatings';
import { playerRatingsApi } from '@/lib/api';
import { toast } from '@/lib/toast';

jest.mock('@/lib/api', () => ({
  playerRatingsApi: {
    createRating: jest.fn(),
    updateRating: jest.fn(),
    flagRating: jest.fn(),
    getRatingsForUser: jest.fn(),
  },
}));

jest.mock('@/lib/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  getActionableErrorMessage: jest.fn((error, action) => `Failed to ${action}`),
}));

describe('usePlayerRatings hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createRating submits successfully and shows toast', async () => {
    (playerRatingsApi.createRating as jest.Mock).mockResolvedValue({ ratingId: '123' });

    const { result } = renderHook(() => usePlayerRatings());

    let response;
    await act(async () => {
      response = await result.current.createRating({
        gameId: 'game-1',
        rateeId: 'user-2',
        rating: 5,
        comment: 'Great player!'
      });
    });

    expect(playerRatingsApi.createRating).toHaveBeenCalledWith({
      gameId: 'game-1',
      rateeId: 'user-2',
      rating: 5,
      comment: 'Great player!'
    });
    expect(response).toEqual({ ratingId: '123' });
    expect(toast.success).toHaveBeenCalledWith('Rating submitted successfully');
    expect(result.current.isLoading).toBe(false);
  });

  it('createRating handles errors correctly', async () => {
    (playerRatingsApi.createRating as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => usePlayerRatings());

    await act(async () => {
      await expect(result.current.createRating({
        gameId: 'game-1',
        rateeId: 'user-2',
        rating: 5
      })).rejects.toThrow('API Error');
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to submit rating');
    expect(result.current.isLoading).toBe(false);
  });

  it('updateRating submits successfully and shows toast', async () => {
    (playerRatingsApi.updateRating as jest.Mock).mockResolvedValue({ ratingId: '123' });

    const { result } = renderHook(() => usePlayerRatings());

    await act(async () => {
      await result.current.updateRating('123', { rating: 4, comment: 'Updated comment' });
    });

    expect(playerRatingsApi.updateRating).toHaveBeenCalledWith('123', { rating: 4, comment: 'Updated comment' });
    expect(toast.success).toHaveBeenCalledWith('Rating updated successfully');
  });

  it('flagRating submits successfully', async () => {
    (playerRatingsApi.flagRating as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => usePlayerRatings());

    await act(async () => {
      await result.current.flagRating('123');
    });

    expect(playerRatingsApi.flagRating).toHaveBeenCalledWith('123');
    expect(toast.success).toHaveBeenCalledWith('Rating has been reported for moderation');
  });
});

describe('useUserRatings hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches ratings for user successfully', async () => {
    const mockRatings = [
      { ratingId: '1', rating: 5, comment: 'Good' }
    ];
    (playerRatingsApi.getRatingsForUser as jest.Mock).mockResolvedValue(mockRatings);

    const { result } = renderHook(() => useUserRatings('user-1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(playerRatingsApi.getRatingsForUser).toHaveBeenCalledWith('user-1');
    expect(result.current.ratings).toEqual(mockRatings);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    (playerRatingsApi.getRatingsForUser as jest.Mock).mockRejectedValue(new Error('Network drop'));

    const { result } = renderHook(() => useUserRatings('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.ratings).toEqual([]);
    expect(result.current.error).toBe('Failed to load user ratings');
  });

  it('does not fetch if userId is absent', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { result } = renderHook(() => useUserRatings(''));

    // Hook sets isLoading to false if !userId
    expect(result.current.isLoading).toBe(false);
    expect(playerRatingsApi.getRatingsForUser).not.toHaveBeenCalled();
  });
});