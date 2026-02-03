import { useState, useEffect, useCallback } from 'react';
import { organizerQualityApi, OqsResponse, OqsSummary, OqsInfoCard, OqsHistoryResponse, OqsHistoryEntry } from '@/lib/api';

interface UseOrganizerQualityOptions {
    userId?: string;
    autoFetch?: boolean;
}

/**
 * Hook for fetching and managing Organizer Quality Score (OQS) data.
 * Implements: US-6.1 - Organizer Quality Score
 */
export function useOrganizerQuality(options: UseOrganizerQualityOptions = {}) {
    const { userId, autoFetch = true } = options;

    const [oqs, setOqs] = useState<OqsResponse | null>(null);
    const [summary, setSummary] = useState<OqsSummary | null>(null);
    const [infoCard, setInfoCard] = useState<OqsInfoCard | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOqs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = userId
                ? await organizerQualityApi.getOqs(userId)
                : await organizerQualityApi.getMyOqs();
            setOqs(response);
        } catch (err) {
            setError('Failed to load organizer quality score');
            console.error('Error fetching OQS:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const fetchSummary = useCallback(async () => {
        try {
            const response = userId
                ? await organizerQualityApi.getOqsSummary(userId)
                : await organizerQualityApi.getMyOqs().then(r => ({
                    userId: r.userId,
                    oqsScore: r.oqsScore,
                    confidenceLevel: r.confidenceLevel,
                    totalGamesHosted: r.totalGamesHosted,
                }));
            setSummary(response);
        } catch (err) {
            console.error('Error fetching OQS summary:', err);
        }
    }, [userId]);

    const fetchInfoCard = useCallback(async () => {
        try {
            const response = userId
                ? await organizerQualityApi.getOqsInfoCard(userId)
                : await organizerQualityApi.getMyOqsInfoCard();
            setInfoCard(response);
        } catch (err) {
            console.error('Error fetching OQS info card:', err);
        }
    }, [userId]);

    const refresh = useCallback(() => {
        fetchOqs();
        fetchSummary();
        fetchInfoCard();
    }, [fetchOqs, fetchSummary, fetchInfoCard]);

    useEffect(() => {
        if (autoFetch) {
            fetchOqs();
            fetchSummary();
            fetchInfoCard();
        }
    }, [autoFetch, fetchOqs, fetchSummary, fetchInfoCard]);

    return {
        oqs,
        summary,
        infoCard,
        isLoading,
        error,
        fetchOqs,
        fetchSummary,
        fetchInfoCard,
        refresh,
    };
}

/**
 * Hook for fetching OQS history with pagination.
 */
export function useOrganizerQualityHistory(options: UseOrganizerQualityOptions & { pageSize?: number } = {}) {
    const { userId, pageSize = 10, autoFetch = true } = options;

    const [history, setHistory] = useState<OqsHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);

    const fetchHistory = useCallback(async (pageNum: number = 0) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: OqsHistoryResponse = userId
                ? await organizerQualityApi.getOqsHistory(userId, pageNum, pageSize)
                : await organizerQualityApi.getMyOqsHistory(pageNum, pageSize);

            if (pageNum === 0) {
                setHistory(response.history);
            } else {
                setHistory(prev => [...prev, ...response.history]);
            }

            setPage(response.currentPage);
            setTotalPages(response.totalPages);
            setTotalEntries(response.totalEntries);
        } catch (err) {
            setError('Failed to load OQS history');
            console.error('Error fetching OQS history:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, pageSize]);

    const loadMore = useCallback(() => {
        if (page < totalPages - 1 && !isLoading) {
            fetchHistory(page + 1);
        }
    }, [page, totalPages, isLoading, fetchHistory]);

    const refresh = useCallback(() => {
        setHistory([]);
        setPage(0);
        fetchHistory(0);
    }, [fetchHistory]);

    useEffect(() => {
        if (autoFetch) {
            fetchHistory(0);
        }
    }, [autoFetch, fetchHistory]);

    return {
        history,
        isLoading,
        error,
        page,
        totalPages,
        totalEntries,
        hasMore: page < totalPages - 1,
        fetchHistory,
        loadMore,
        refresh,
    };
}

/**
 * Format OQS score for display.
 */
export function formatOqsScore(score: number): string {
    return `${Math.round(score)}%`;
}

/**
 * Get color class based on OQS score.
 */
export function getOqsColorClass(score: number): string {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
}

/**
 * Get background color class based on OQS score.
 */
export function getOqsBgColorClass(score: number): string {
    if (score >= 90) return 'bg-emerald-100';
    if (score >= 75) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
}

/**
 * Get confidence level display info.
 */
export function getConfidenceLevelInfo(level: string): { label: string; color: string; icon: string } {
    switch (level) {
        case 'HIGH':
            return { label: 'High Confidence', color: 'text-emerald-600', icon: '●●●' };
        case 'MEDIUM':
            return { label: 'Medium Confidence', color: 'text-yellow-600', icon: '●●○' };
        case 'LOW':
        default:
            return { label: 'Low Confidence', color: 'text-gray-500', icon: '●○○' };
    }
}

/**
 * Format OQS delta for display.
 */
export function formatOqsDelta(delta: number): string {
    if (delta > 0) return `+${delta.toFixed(1)}%`;
    if (delta < 0) return `${delta.toFixed(1)}%`;
    return '0%';
}

/**
 * Get delta color class.
 */
export function getOqsDeltaColor(delta: number): string {
    if (delta > 0) return 'text-emerald-600';
    if (delta < 0) return 'text-red-600';
    return 'text-gray-600';
}

/**
 * Format OQS change reason for display.
 */
export function formatOqsReason(reason: string): { label: string; color: string } {
    switch (reason) {
        case 'GAME_COMPLETED':
            return { label: 'Game Completed', color: 'text-emerald-600' };
        case 'GAME_CANCELLED':
            return { label: 'Game Cancelled', color: 'text-red-600' };
        case 'PLAYER_RETURNED':
            return { label: 'Returning Player', color: 'text-blue-600' };
        case 'INITIAL_CALCULATION':
            return { label: 'Initial Score', color: 'text-gray-600' };
        case 'MANUAL_ADJUSTMENT':
            return { label: 'Admin Adjustment', color: 'text-purple-600' };
        case 'RECALCULATION':
            return { label: 'Recalculated', color: 'text-gray-600' };
        default:
            return { label: reason, color: 'text-gray-600' };
    }
}
