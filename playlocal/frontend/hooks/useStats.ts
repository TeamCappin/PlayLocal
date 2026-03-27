import { useState, useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { statsApi, StatsResponse, StatsTimeframe } from '@/lib/api';

export interface UseStatsState {
  data: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseStatsResult {
  showUpRate: UseStatsState;
  skillTrend: UseStatsState;
  attendanceRate: UseStatsState;
  playerRating: UseStatsState;
  timeframe: StatsTimeframe;
  setTimeframe: (tf: StatsTimeframe) => void;
  refresh: () => void;
}

const INITIAL_STATE: UseStatsState = {
  data: null,
  isLoading: true,
  error: null,
};

/**
 * Hook that fetches all three stats metrics for the authenticated user.
 * US-7.6: Stats & Analytics Dashboard
 *
 * @param initialTimeframe  Default timeframe on mount (default "30").
 */
export function useStats(initialTimeframe: StatsTimeframe = '30'): UseStatsResult {
  const [timeframe, setTimeframe] = useState<StatsTimeframe>(initialTimeframe);

  const [showUpRate,       setShowUpRate]       = useState<UseStatsState>(INITIAL_STATE);
  const [skillTrend,    setSkillTrend]    = useState<UseStatsState>(INITIAL_STATE);
  const [attendanceRate, setAttendanceRate] = useState<UseStatsState>(INITIAL_STATE);
  const [playerRating, setPlayerRating] = useState<UseStatsState>(INITIAL_STATE);

  const fetchMetric = useCallback(
    async <T extends UseStatsState>(
      fetcher: () => Promise<StatsResponse>,
      setter: Dispatch<SetStateAction<T>>,
      label: string,
    ) => {
      setter((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await fetcher();
        setter({ data, isLoading: false, error: null } as T);
      } catch {
        setter({
          data: null,
          isLoading: false,
          error: `Failed to load ${label}`,
        } as T);
      }
    },
    [],
  );

  const fetchAll = useCallback(() => {
    fetchMetric(() => statsApi.getShowUpRate(timeframe),       setShowUpRate,       'show-up rate');
    fetchMetric(() => statsApi.getSkillTrend(timeframe),    setSkillTrend,    'skill trend');
    fetchMetric(() => statsApi.getAttendanceRate(timeframe), setAttendanceRate, 'attendance rate');
    fetchMetric(() => statsApi.getPlayerRatingStats(timeframe), setPlayerRating, 'player rating');
  }, [timeframe, fetchMetric]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    showUpRate,
    skillTrend,
    attendanceRate,
    playerRating,
    timeframe,
    setTimeframe,
    refresh: fetchAll,
  };
}
