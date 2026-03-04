import { useState, useEffect, useCallback } from 'react';
import {
  scoreHistoryApi,
  ScoreHistoryResponse,
  ScoreSummary,
  ScoreHistoryEntry,
} from '@/lib/api';

interface UseScoreHistoryOptions {
  userId?: string;
  pageSize?: number;
  autoFetch?: boolean;
}

export function useScoreHistory(options: UseScoreHistoryOptions = {}) {
  const { userId, pageSize = 10, autoFetch = true } = options;

  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  const fetchHistory = useCallback(
    async (pageNum: number = 0) => {
      setIsLoading(true);
      setError(null);
      try {
        const response: ScoreHistoryResponse = userId
          ? await scoreHistoryApi.getHistory(userId, pageNum, pageSize)
          : await scoreHistoryApi.getMyHistory(pageNum, pageSize);

        if (pageNum === 0) {
          setHistory(response.history);
        } else {
          setHistory((prev) => [...prev, ...response.history]);
        }

        setCurrentScore(response.currentScore);
        setPage(response.currentPage);
        setTotalPages(response.totalPages);
        setTotalEntries(response.totalEntries);
      } catch (err) {
        setError('Failed to load score history');
        console.error('Error fetching score history:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, pageSize]
  );

  const fetchSummary = useCallback(async () => {
    try {
      const data = userId
        ? await scoreHistoryApi.getSummary(userId)
        : await scoreHistoryApi.getMySummary();
      setSummary(data);
      setCurrentScore(data.currentScore);
    } catch (err) {
      console.error('Error fetching score summary:', err);
    }
  }, [userId]);

  const loadMore = useCallback(() => {
    if (page < totalPages - 1 && !isLoading) {
      fetchHistory(page + 1);
    }
  }, [page, totalPages, isLoading, fetchHistory]);

  const refresh = useCallback(() => {
    setHistory([]);
    setPage(0);
    fetchHistory(0);
    fetchSummary();
  }, [fetchHistory, fetchSummary]);

  useEffect(() => {
    if (autoFetch) {
      fetchHistory(0);
      fetchSummary();
    }
  }, [autoFetch, fetchHistory, fetchSummary]);

  return {
    history,
    summary,
    currentScore,
    isLoading,
    error,
    page,
    totalPages,
    totalEntries,
    hasMore: page < totalPages - 1,
    fetchHistory,
    fetchSummary,
    loadMore,
    refresh,
  };
}

export function formatScoreReason(reason: string): {
  label: string;
  color: string;
  icon: string;
} {
  switch (reason) {
    case 'ATTENDANCE':
      return { label: 'Attended', color: 'text-green-600', icon: '✓' };
    case 'NO_SHOW':
      return { label: 'No-show', color: 'text-red-600', icon: '✗' };
    case 'MANUAL_ADJUSTMENT':
      return { label: 'Adjustment', color: 'text-blue-600', icon: '⚙' };
    case 'DISPUTE_RESOLVED':
      return { label: 'Dispute Resolved', color: 'text-purple-600', icon: '⚖' };
    default:
      return { label: reason, color: 'text-gray-600', icon: '•' };
  }
}

export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta.toFixed(1)}%`;
  if (delta < 0) return `${delta.toFixed(1)}%`;
  return '0%';
}

export function getDeltaColor(delta: number): string {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-600';
}
