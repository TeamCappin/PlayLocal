import { renderHook, act, waitFor } from '@testing-library/react';
import {
    useOrganizerQuality,
    useOrganizerQualityHistory,
    formatOqsScore,
    getOqsColorClass,
    getOqsBgColorClass,
    getConfidenceLevelInfo,
    formatOqsDelta,
    getOqsDeltaColor,
    formatOqsReason,
} from '@/hooks/useOrganizerQuality';
import { organizerQualityApi } from '@/lib/api';

// Mock the API module - include all APIs to prevent undefined errors
jest.mock('@/lib/api', () => {
    const mockFn = jest.fn(() => Promise.resolve({}));
    return {
        organizerQualityApi: {
            getOqs: jest.fn(),
            getMyOqs: jest.fn(),
            getOqsSummary: jest.fn(),
            getOqsInfoCard: jest.fn(),
            getMyOqsInfoCard: jest.fn(),
            getOqsHistory: jest.fn(),
            getMyOqsHistory: jest.fn(),
            getWeights: jest.fn(),
        },
        gamesApi: {
            getUpcoming: mockFn,
            getPast: mockFn,
            getPastByUserNeedingAttendanceUpdate: mockFn,
            getById: mockFn,
            getRoster: mockFn,
            create: mockFn,
            join: mockFn,
            leave: mockFn,
            cancel: mockFn,
            getGameParticipation: mockFn,
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

const mockOqsResponse = {
    userId: 'user-123',
    oqsScore: 85.5,
    gameCompletionRate: 90,
    repeatPlayerRate: 80,
    confidenceLevel: 'HIGH',
    totalGamesHosted: 10,
    completedGames: 9,
    cancelledGames: 1,
    uniquePlayers: 50,
    repeatPlayers: 40,
    lastCalculatedAt: '2026-01-01T00:00:00Z',
};

const mockOqsSummary = {
    userId: 'user-123',
    oqsScore: 85.5,
    confidenceLevel: 'HIGH',
    totalGamesHosted: 10,
};

const mockInfoCard = {
    userId: 'user-123',
    headline: 'Great organizer!',
    summary: 'This organizer has a great track record.',
    tips: ['Keep up the good work!'],
};

const mockHistoryResponse = {
    history: [
        {
            id: '1',
            previousScore: 80,
            newScore: 85,
            delta: 5,
            reason: 'GAME_COMPLETED',
            createdAt: '2026-01-01T00:00:00Z',
        },
    ],
    currentPage: 0,
    totalPages: 1,
    totalEntries: 1,
};

/**
 * Unit tests for useOrganizerQuality hook and utility functions.
 * Implements: US-6.1 - Organizer Quality Score
 */

describe('useOrganizerQuality utility functions', () => {
    
    // ==================== formatOqsScore ====================
    describe('formatOqsScore', () => {
        it('should format whole numbers correctly', () => {
            expect(formatOqsScore(100)).toBe('100%');
            expect(formatOqsScore(85)).toBe('85%');
            expect(formatOqsScore(0)).toBe('0%');
        });

        it('should round decimal values', () => {
            expect(formatOqsScore(85.4)).toBe('85%');
            expect(formatOqsScore(85.5)).toBe('86%');
            expect(formatOqsScore(85.9)).toBe('86%');
        });
    });

    // ==================== getOqsColorClass ====================
    describe('getOqsColorClass', () => {
        it('should return emerald for scores >= 90', () => {
            expect(getOqsColorClass(90)).toBe('text-emerald-600');
            expect(getOqsColorClass(95)).toBe('text-emerald-600');
            expect(getOqsColorClass(100)).toBe('text-emerald-600');
        });

        it('should return green for scores >= 75 and < 90', () => {
            expect(getOqsColorClass(75)).toBe('text-green-600');
            expect(getOqsColorClass(80)).toBe('text-green-600');
            expect(getOqsColorClass(89)).toBe('text-green-600');
        });

        it('should return yellow for scores >= 60 and < 75', () => {
            expect(getOqsColorClass(60)).toBe('text-yellow-600');
            expect(getOqsColorClass(65)).toBe('text-yellow-600');
            expect(getOqsColorClass(74)).toBe('text-yellow-600');
        });

        it('should return orange for scores >= 40 and < 60', () => {
            expect(getOqsColorClass(40)).toBe('text-orange-600');
            expect(getOqsColorClass(50)).toBe('text-orange-600');
            expect(getOqsColorClass(59)).toBe('text-orange-600');
        });

        it('should return red for scores < 40', () => {
            expect(getOqsColorClass(39)).toBe('text-red-600');
            expect(getOqsColorClass(20)).toBe('text-red-600');
            expect(getOqsColorClass(0)).toBe('text-red-600');
        });
    });

    // ==================== getOqsBgColorClass ====================
    describe('getOqsBgColorClass', () => {
        it('should return emerald background for scores >= 90', () => {
            expect(getOqsBgColorClass(90)).toBe('bg-emerald-100');
            expect(getOqsBgColorClass(100)).toBe('bg-emerald-100');
        });

        it('should return green background for scores >= 75 and < 90', () => {
            expect(getOqsBgColorClass(75)).toBe('bg-green-100');
            expect(getOqsBgColorClass(89)).toBe('bg-green-100');
        });

        it('should return yellow background for scores >= 60 and < 75', () => {
            expect(getOqsBgColorClass(60)).toBe('bg-yellow-100');
            expect(getOqsBgColorClass(74)).toBe('bg-yellow-100');
        });

        it('should return orange background for scores >= 40 and < 60', () => {
            expect(getOqsBgColorClass(40)).toBe('bg-orange-100');
            expect(getOqsBgColorClass(59)).toBe('bg-orange-100');
        });

        it('should return red background for scores < 40', () => {
            expect(getOqsBgColorClass(39)).toBe('bg-red-100');
            expect(getOqsBgColorClass(0)).toBe('bg-red-100');
        });
    });

    // ==================== getConfidenceLevelInfo ====================
    describe('getConfidenceLevelInfo', () => {
        it('should return HIGH confidence info', () => {
            const result = getConfidenceLevelInfo('HIGH');
            expect(result.label).toBe('High Confidence');
            expect(result.color).toBe('text-emerald-600');
        });

        it('should return MEDIUM confidence info', () => {
            const result = getConfidenceLevelInfo('MEDIUM');
            expect(result.label).toBe('Medium Confidence');
            expect(result.color).toBe('text-yellow-600');
        });

        it('should return LOW confidence info', () => {
            const result = getConfidenceLevelInfo('LOW');
            expect(result.label).toBe('Low Confidence');
            expect(result.color).toBe('text-gray-500');
        });

        it('should return LOW confidence info for unknown values', () => {
            const result = getConfidenceLevelInfo('UNKNOWN');
            expect(result.label).toBe('Low Confidence');
            expect(result.color).toBe('text-gray-500');
        });
    });

    // ==================== formatOqsDelta ====================
    describe('formatOqsDelta', () => {
        it('should format positive deltas with + sign', () => {
            expect(formatOqsDelta(5)).toBe('+5.0%');
            expect(formatOqsDelta(2.5)).toBe('+2.5%');
            expect(formatOqsDelta(0.1)).toBe('+0.1%');
        });

        it('should format negative deltas with - sign', () => {
            expect(formatOqsDelta(-5)).toBe('-5.0%');
            expect(formatOqsDelta(-2.5)).toBe('-2.5%');
            expect(formatOqsDelta(-0.1)).toBe('-0.1%');
        });

        it('should format zero delta without sign', () => {
            expect(formatOqsDelta(0)).toBe('0%');
        });
    });

    // ==================== getOqsDeltaColor ====================
    describe('getOqsDeltaColor', () => {
        it('should return emerald for positive deltas', () => {
            expect(getOqsDeltaColor(5)).toBe('text-emerald-600');
            expect(getOqsDeltaColor(0.1)).toBe('text-emerald-600');
        });

        it('should return red for negative deltas', () => {
            expect(getOqsDeltaColor(-5)).toBe('text-red-600');
            expect(getOqsDeltaColor(-0.1)).toBe('text-red-600');
        });

        it('should return gray for zero delta', () => {
            expect(getOqsDeltaColor(0)).toBe('text-gray-600');
        });
    });

    // ==================== formatOqsReason ====================
    describe('formatOqsReason', () => {
        it('should format GAME_COMPLETED reason', () => {
            const result = formatOqsReason('GAME_COMPLETED');
            expect(result.label).toBe('Game Completed');
            expect(result.color).toBe('text-emerald-600');
        });

        it('should format GAME_CANCELLED reason', () => {
            const result = formatOqsReason('GAME_CANCELLED');
            expect(result.label).toBe('Game Cancelled');
            expect(result.color).toBe('text-red-600');
        });

        it('should format PLAYER_RETURNED reason', () => {
            const result = formatOqsReason('PLAYER_RETURNED');
            expect(result.label).toBe('Returning Player');
            expect(result.color).toBe('text-blue-600');
        });

        it('should format INITIAL_CALCULATION reason', () => {
            const result = formatOqsReason('INITIAL_CALCULATION');
            expect(result.label).toBe('Initial Score');
            expect(result.color).toBe('text-gray-600');
        });

        it('should format MANUAL_ADJUSTMENT reason', () => {
            const result = formatOqsReason('MANUAL_ADJUSTMENT');
            expect(result.label).toBe('Admin Adjustment');
            expect(result.color).toBe('text-purple-600');
        });

        it('should format RECALCULATION reason', () => {
            const result = formatOqsReason('RECALCULATION');
            expect(result.label).toBe('Recalculated');
            expect(result.color).toBe('text-gray-600');
        });

        it('should return raw reason for unknown values', () => {
            const result = formatOqsReason('UNKNOWN_REASON');
            expect(result.label).toBe('UNKNOWN_REASON');
            expect(result.color).toBe('text-gray-600');
        });
    });
});

// ==================== useOrganizerQuality Hook Tests ====================
describe('useOrganizerQuality hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch OQS data with userId', async () => {
        (organizerQualityApi.getOqs as jest.Mock).mockResolvedValue(mockOqsResponse);
        (organizerQualityApi.getOqsSummary as jest.Mock).mockResolvedValue(mockOqsSummary);
        (organizerQualityApi.getOqsInfoCard as jest.Mock).mockResolvedValue(mockInfoCard);

        const { result } = renderHook(() => useOrganizerQuality({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(organizerQualityApi.getOqs).toHaveBeenCalledWith('user-123');
        expect(organizerQualityApi.getOqsSummary).toHaveBeenCalledWith('user-123');
        expect(organizerQualityApi.getOqsInfoCard).toHaveBeenCalledWith('user-123');
        expect(result.current.oqs).toEqual(mockOqsResponse);
    });

    it('should fetch OQS data without userId (current user)', async () => {
        (organizerQualityApi.getMyOqs as jest.Mock).mockResolvedValue(mockOqsResponse);
        (organizerQualityApi.getMyOqsInfoCard as jest.Mock).mockResolvedValue(mockInfoCard);

        const { result } = renderHook(() => useOrganizerQuality({}));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(organizerQualityApi.getMyOqs).toHaveBeenCalled();
        expect(organizerQualityApi.getMyOqsInfoCard).toHaveBeenCalled();
        expect(result.current.oqs).toEqual(mockOqsResponse);
    });

    it('should handle fetch error', async () => {
        (organizerQualityApi.getOqs as jest.Mock).mockRejectedValue(new Error('API Error'));
        (organizerQualityApi.getOqsSummary as jest.Mock).mockResolvedValue(mockOqsSummary);
        (organizerQualityApi.getOqsInfoCard as jest.Mock).mockResolvedValue(mockInfoCard);

        const { result } = renderHook(() => useOrganizerQuality({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to load organizer quality score');
        expect(result.current.oqs).toBeNull();
    });

    it('should not auto-fetch when autoFetch is false', async () => {
        const { result } = renderHook(() => useOrganizerQuality({ userId: 'user-123', autoFetch: false }));

        expect(organizerQualityApi.getOqs).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });

    it('should refresh data when refresh is called', async () => {
        (organizerQualityApi.getOqs as jest.Mock).mockResolvedValue(mockOqsResponse);
        (organizerQualityApi.getOqsSummary as jest.Mock).mockResolvedValue(mockOqsSummary);
        (organizerQualityApi.getOqsInfoCard as jest.Mock).mockResolvedValue(mockInfoCard);

        const { result } = renderHook(() => useOrganizerQuality({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Clear mocks to track refresh calls
        jest.clearAllMocks();
        (organizerQualityApi.getOqs as jest.Mock).mockResolvedValue(mockOqsResponse);
        (organizerQualityApi.getOqsSummary as jest.Mock).mockResolvedValue(mockOqsSummary);
        (organizerQualityApi.getOqsInfoCard as jest.Mock).mockResolvedValue(mockInfoCard);

        act(() => {
            result.current.refresh();
        });

        await waitFor(() => {
            expect(organizerQualityApi.getOqs).toHaveBeenCalledWith('user-123');
        });
    });

    it('should handle info card fetch error gracefully', async () => {
        (organizerQualityApi.getOqs as jest.Mock).mockResolvedValue(mockOqsResponse);
        (organizerQualityApi.getOqsSummary as jest.Mock).mockResolvedValue(mockOqsSummary);
        (organizerQualityApi.getOqsInfoCard as jest.Mock).mockRejectedValue(new Error('Info card error'));

        const { result } = renderHook(() => useOrganizerQuality({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // OQS should still load even if info card fails
        expect(result.current.oqs).toEqual(mockOqsResponse);
        expect(result.current.infoCard).toBeNull();
    });

    it('should handle summary fetch error gracefully', async () => {
        (organizerQualityApi.getOqs as jest.Mock).mockResolvedValue(mockOqsResponse);
        (organizerQualityApi.getOqsSummary as jest.Mock).mockRejectedValue(new Error('Summary error'));
        (organizerQualityApi.getOqsInfoCard as jest.Mock).mockResolvedValue(mockInfoCard);

        const { result } = renderHook(() => useOrganizerQuality({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.oqs).toEqual(mockOqsResponse);
        expect(result.current.summary).toBeNull();
    });
});

// ==================== useOrganizerQualityHistory Hook Tests ====================
describe('useOrganizerQualityHistory hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch history with userId', async () => {
        (organizerQualityApi.getOqsHistory as jest.Mock).mockResolvedValue(mockHistoryResponse);

        const { result } = renderHook(() => useOrganizerQualityHistory({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(organizerQualityApi.getOqsHistory).toHaveBeenCalledWith('user-123', 0, 10);
        expect(result.current.history).toEqual(mockHistoryResponse.history);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.totalEntries).toBe(1);
    });

    it('should fetch history without userId (current user)', async () => {
        (organizerQualityApi.getMyOqsHistory as jest.Mock).mockResolvedValue(mockHistoryResponse);

        const { result } = renderHook(() => useOrganizerQualityHistory({}));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(organizerQualityApi.getMyOqsHistory).toHaveBeenCalledWith(0, 10);
        expect(result.current.history).toEqual(mockHistoryResponse.history);
    });

    it('should handle fetch error', async () => {
        (organizerQualityApi.getOqsHistory as jest.Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useOrganizerQualityHistory({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to load OQS history');
        expect(result.current.history).toEqual([]);
    });

    it('should not auto-fetch when autoFetch is false', async () => {
        const { result } = renderHook(() => useOrganizerQualityHistory({ userId: 'user-123', autoFetch: false }));

        expect(organizerQualityApi.getOqsHistory).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });

    it('should load more pages', async () => {
        const page1Response = {
            history: [{ id: '1', previousScore: 80, newScore: 85, delta: 5, reason: 'GAME_COMPLETED', createdAt: '2026-01-01T00:00:00Z' }],
            currentPage: 0,
            totalPages: 2,
            totalEntries: 2,
        };
        const page2Response = {
            history: [{ id: '2', previousScore: 85, newScore: 90, delta: 5, reason: 'GAME_COMPLETED', createdAt: '2026-01-02T00:00:00Z' }],
            currentPage: 1,
            totalPages: 2,
            totalEntries: 2,
        };

        (organizerQualityApi.getOqsHistory as jest.Mock)
            .mockResolvedValueOnce(page1Response)
            .mockResolvedValueOnce(page2Response);

        const { result } = renderHook(() => useOrganizerQualityHistory({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.hasMore).toBe(true);

        act(() => {
            result.current.loadMore();
        });

        await waitFor(() => {
            expect(result.current.history).toHaveLength(2);
        });

        expect(result.current.hasMore).toBe(false);
    });

    it('should refresh history', async () => {
        (organizerQualityApi.getOqsHistory as jest.Mock).mockResolvedValue(mockHistoryResponse);

        const { result } = renderHook(() => useOrganizerQualityHistory({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        jest.clearAllMocks();
        (organizerQualityApi.getOqsHistory as jest.Mock).mockResolvedValue(mockHistoryResponse);

        act(() => {
            result.current.refresh();
        });

        await waitFor(() => {
            expect(organizerQualityApi.getOqsHistory).toHaveBeenCalledWith('user-123', 0, 10);
        });
    });

    it('should use custom pageSize', async () => {
        (organizerQualityApi.getOqsHistory as jest.Mock).mockResolvedValue(mockHistoryResponse);

        renderHook(() => useOrganizerQualityHistory({ userId: 'user-123', pageSize: 20 }));

        await waitFor(() => {
            expect(organizerQualityApi.getOqsHistory).toHaveBeenCalledWith('user-123', 0, 20);
        });
    });

    it('should not load more when already loading', async () => {
        (organizerQualityApi.getOqsHistory as jest.Mock).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve(mockHistoryResponse), 100))
        );

        const { result } = renderHook(() => useOrganizerQualityHistory({ userId: 'user-123' }));

        // Try to load more while still loading initial data
        act(() => {
            result.current.loadMore();
        });

        // Should only have one call (the initial fetch)
        expect(organizerQualityApi.getOqsHistory).toHaveBeenCalledTimes(1);
    });

    it('should not load more when on last page', async () => {
        (organizerQualityApi.getOqsHistory as jest.Mock).mockResolvedValue({
            ...mockHistoryResponse,
            currentPage: 0,
            totalPages: 1,
        });

        const { result } = renderHook(() => useOrganizerQualityHistory({ userId: 'user-123' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.hasMore).toBe(false);

        jest.clearAllMocks();

        act(() => {
            result.current.loadMore();
        });

        expect(organizerQualityApi.getOqsHistory).not.toHaveBeenCalled();
    });
});