import { act, renderHook, waitFor } from '@testing-library/react';
import { useAttendance } from './useAttendance';
import { attendanceApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  attendanceApi: {
    getPending: jest.fn(),
    confirm: jest.fn(),
  },
}));

const mockGetPending = attendanceApi.getPending as jest.MockedFunction<typeof attendanceApi.getPending>;
const mockConfirm = attendanceApi.confirm as jest.MockedFunction<typeof attendanceApi.confirm>;

const mockEntry = {
  participationId: 'p1',
  attendanceStatus: 'ATTENDED' as const,
  userId: 'u1',
  sportId: 's1',
  requestedPositionRoleId: 'r1',
};

const mockResponse = {
  gameId: 'g1',
  attendedCount: 1,
  noShowCount: 0,
  updatedScores: [],
};

describe('useAttendance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when gameId is undefined', async () => {
    const { result } = renderHook(() => useAttendance(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetPending).not.toHaveBeenCalled();
    expect(result.current.pendingAttendance).toEqual([]);
  });

  it('fetches pending attendance on mount when gameId is set', async () => {
    mockGetPending.mockResolvedValue([mockEntry]);

    const { result } = renderHook(() => useAttendance('game-123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetPending).toHaveBeenCalledWith('game-123');
    expect(result.current.pendingAttendance).toEqual([mockEntry]);
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    mockGetPending.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAttendance('game-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load attendance data');
    expect(result.current.pendingAttendance).toEqual([]);
  });

  it('confirmAttendance calls API and clears pending on success', async () => {
    mockGetPending.mockResolvedValue([mockEntry]);
    mockConfirm.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAttendance('game-123'));

    await waitFor(() => {
      expect(result.current.pendingAttendance).toHaveLength(1);
    });

    await act(async () => {
      await result.current.confirmAttendance([mockEntry]);
    });

    expect(mockConfirm).toHaveBeenCalledWith('game-123', [mockEntry]);
    expect(result.current.pendingAttendance).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('confirmAttendance sets error and throws when API fails', async () => {
    mockGetPending.mockResolvedValue([mockEntry]);
    mockConfirm.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useAttendance('game-123'));

    await waitFor(() => {
      expect(result.current.pendingAttendance).toHaveLength(1);
    });

    let thrown: Error | null = null;
    await act(async () => {
      try {
        await result.current.confirmAttendance([mockEntry]);
      } catch (e) {
        thrown = e as Error;
      }
    });

    expect(thrown).not.toBeNull();
    expect(thrown!.message).toBe('Server error');
    expect(result.current.error).toBe('Failed to confirm attendance');
  });

  it('confirmAttendance throws when gameId is undefined', async () => {
    const { result } = renderHook(() => useAttendance(undefined));

    await expect(
      act(async () => {
        await result.current.confirmAttendance([mockEntry]);
      })
    ).rejects.toThrow('Game ID required');

    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('fetchPending can be called manually', async () => {
    mockGetPending.mockResolvedValue([]);

    const { result } = renderHook(() => useAttendance('game-456'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockGetPending.mockResolvedValue([mockEntry]);

    await act(async () => {
      result.current.fetchPending();
    });

    await waitFor(() => {
      expect(result.current.pendingAttendance).toEqual([mockEntry]);
    });
    expect(mockGetPending).toHaveBeenCalledTimes(2);
  });
});
