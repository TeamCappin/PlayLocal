import { renderHook, act, waitFor } from '@testing-library/react';
import { useStats } from '../../hooks/useStats';
import { statsApi } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  statsApi: {
    getWinRate: jest.fn(),
    getSkillTrend: jest.fn(),
    getAttendanceRate: jest.fn(),
  },
}));

describe('useStats hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default timeframe and fetches data successfully', async () => {
    const mockWinRate = { value: 75, trend: 5 };
    const mockSkillTrend = { data: [] };
    const mockAttendanceRate = { rate: 90 };

    (statsApi.getWinRate as jest.Mock).mockResolvedValue(mockWinRate);
    (statsApi.getSkillTrend as jest.Mock).mockResolvedValue(mockSkillTrend);
    (statsApi.getAttendanceRate as jest.Mock).mockResolvedValue(mockAttendanceRate);

    const { result } = renderHook(() => useStats());

    // Initially loading
    expect(result.current.timeframe).toBe('30');
    expect(result.current.winRate.isLoading).toBe(true);

    // Wait for the mock fetches to resolve
    await waitFor(() => {
      expect(result.current.winRate.isLoading).toBe(false);
    });

    // Check successful states
    expect(result.current.winRate.data).toEqual(mockWinRate);
    expect(result.current.winRate.error).toBeNull();
    
    expect(result.current.skillTrend.data).toEqual(mockSkillTrend);
    expect(result.current.attendanceRate.data).toEqual(mockAttendanceRate);
  });

  it('handles fetch errors gracefully', async () => {
    (statsApi.getWinRate as jest.Mock).mockRejectedValue(new Error('Network error'));
    (statsApi.getSkillTrend as jest.Mock).mockRejectedValue(new Error('Network error'));
    (statsApi.getAttendanceRate as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useStats());

    await waitFor(() => {
      expect(result.current.winRate.isLoading).toBe(false);
    });

    expect(result.current.winRate.error).toBe('Failed to load win rate');
    expect(result.current.winRate.data).toBeNull();

    expect(result.current.skillTrend.error).toBe('Failed to load skill trend');
    expect(result.current.attendanceRate.error).toBe('Failed to load attendance rate');
  });

  it('updates timeframe and refetches data', async () => {
    (statsApi.getWinRate as jest.Mock).mockResolvedValue({});
    (statsApi.getSkillTrend as jest.Mock).mockResolvedValue({});
    (statsApi.getAttendanceRate as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useStats('30'));

    await waitFor(() => {
      expect(result.current.winRate.isLoading).toBe(false);
    });

    expect(statsApi.getWinRate).toHaveBeenCalledWith('30');

    // Change timeframe
    act(() => {
      result.current.setTimeframe('90');
    });

    expect(result.current.timeframe).toBe('90');
    expect(result.current.winRate.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.winRate.isLoading).toBe(false);
    });

    expect(statsApi.getWinRate).toHaveBeenCalledWith('90');
  });

  it('supports refresh action manually', async () => {
    (statsApi.getWinRate as jest.Mock).mockResolvedValue({});
    (statsApi.getSkillTrend as jest.Mock).mockResolvedValue({});
    (statsApi.getAttendanceRate as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useStats());

    await waitFor(() => {
      expect(result.current.winRate.isLoading).toBe(false);
    });

    expect(statsApi.getWinRate).toHaveBeenCalledTimes(1);

    // Call refresh
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(statsApi.getWinRate).toHaveBeenCalledTimes(2);
    });
  });
});
