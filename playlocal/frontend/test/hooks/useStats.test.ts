import { renderHook, act, waitFor } from '@testing-library/react';
import { useStats } from '@/hooks/useStats';
import { statsApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  statsApi: {
    getShowUpRate: jest.fn(),
    getSkillTrend: jest.fn(),
    getAttendanceRate: jest.fn(),
    getPlayerRatingStats: jest.fn(),
  },
}));

describe('useStats hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default timeframe and fetches data successfully', async () => {
    const mockShowUpRate = { value: 75, trend: 5 };
    const mockSkillTrend = { data: [] };
    const mockAttendanceRate = { rate: 90 };
    const mockPlayerRating = { value: 4.5, count: 12 };

    (statsApi.getShowUpRate as jest.Mock).mockResolvedValue(mockShowUpRate);
    (statsApi.getSkillTrend as jest.Mock).mockResolvedValue(mockSkillTrend);
    (statsApi.getAttendanceRate as jest.Mock).mockResolvedValue(mockAttendanceRate);
    (statsApi.getPlayerRatingStats as jest.Mock).mockResolvedValue(mockPlayerRating);

    const { result } = renderHook(() => useStats());

    // Initially loading
    expect(result.current.timeframe).toBe('all');
    expect(result.current.showUpRate.isLoading).toBe(true);

    // Wait for the mock fetches to resolve
    await waitFor(() => {
      expect(result.current.showUpRate.isLoading).toBe(false);
    });

    // Check successful states
    expect(result.current.showUpRate.data).toEqual(mockShowUpRate);
    expect(result.current.showUpRate.error).toBeNull();
    
    expect(result.current.skillTrend.data).toEqual(mockSkillTrend);
    expect(result.current.attendanceRate.data).toEqual(mockAttendanceRate);
    expect(result.current.playerRating.data).toEqual(mockPlayerRating);
  });

  it('handles fetch errors gracefully', async () => {
    (statsApi.getShowUpRate as jest.Mock).mockRejectedValue(new Error('Network error'));
    (statsApi.getSkillTrend as jest.Mock).mockRejectedValue(new Error('Network error'));
    (statsApi.getAttendanceRate as jest.Mock).mockRejectedValue(new Error('Network error'));
    (statsApi.getPlayerRatingStats as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useStats());

    await waitFor(() => {
      expect(result.current.showUpRate.isLoading).toBe(false);
      expect(result.current.playerRating.isLoading).toBe(false);
    });

    expect(result.current.showUpRate.error).toBe('Failed to load show-up rate');
    expect(result.current.showUpRate.data).toBeNull();

    expect(result.current.skillTrend.error).toBe('Failed to load skill trend');
    expect(result.current.attendanceRate.error).toBe('Failed to load attendance rate');
    expect(result.current.playerRating.error).toBe('Failed to load player rating');
  });

  it('updates timeframe and refetches data', async () => {
    (statsApi.getShowUpRate as jest.Mock).mockResolvedValue({});
    (statsApi.getSkillTrend as jest.Mock).mockResolvedValue({});
    (statsApi.getAttendanceRate as jest.Mock).mockResolvedValue({});
    (statsApi.getPlayerRatingStats as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useStats('30'));

    await waitFor(() => {
      expect(result.current.showUpRate.isLoading).toBe(false);
    });

    expect(statsApi.getShowUpRate).toHaveBeenCalledWith('30');

    // Change timeframe
    act(() => {
      result.current.setTimeframe('90');
    });

    expect(result.current.timeframe).toBe('90');
    expect(result.current.showUpRate.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.showUpRate.isLoading).toBe(false);
    });

    expect(statsApi.getShowUpRate).toHaveBeenCalledWith('90');
  });

  it('supports refresh action manually', async () => {
    (statsApi.getShowUpRate as jest.Mock).mockResolvedValue({});
    (statsApi.getSkillTrend as jest.Mock).mockResolvedValue({});
    (statsApi.getAttendanceRate as jest.Mock).mockResolvedValue({});
    (statsApi.getPlayerRatingStats as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useStats());

    await waitFor(() => {
      expect(result.current.showUpRate.isLoading).toBe(false);
    });

    expect(statsApi.getShowUpRate).toHaveBeenCalledTimes(1);

    // Call refresh
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(statsApi.getShowUpRate).toHaveBeenCalledTimes(2);
    });
  });
});
