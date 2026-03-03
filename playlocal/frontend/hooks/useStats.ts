import { useState, useEffect, useCallback } from 'react';
import { statsApi, StatsResponse, StatsTimeframe } from '@/lib/api';

export interface UseStatsState {
  data: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseStatsResult {
  winRate: UseStatsState;
  skillTrend: UseStatsState;
  attendanceRate: UseStatsState;
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

  const [winRate,       setWinRate]       = useState<UseStatsState>(INITIAL_STATE);
  const [skillTrend,    setSkillTrend]    = useState<UseStatsState>(INITIAL_STATE);
  const [attendanceRate, setAttendanceRate] = useState<UseStatsState>(INITIAL_STATE);

  const fetchMetric = useCallback(
    async <T extends UseStatsState>(
      fetcher: () => Promise<StatsResponse>,
      setter: React.Dispatch<React.SetStateAction<T>>,
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
    fetchMetric(() => statsApi.getWinRate(timeframe),       setWinRate,       'win rate');
    fetchMetric(() => statsApi.getSkillTrend(timeframe),    setSkillTrend,    'skill trend');
    fetchMetric(() => statsApi.getAttendanceRate(timeframe), setAttendanceRate, 'attendance rate');
  }, [timeframe, fetchMetric]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    winRate,
    skillTrend,
    attendanceRate,
    timeframe,
    setTimeframe,
    refresh: fetchAll,
  };
}
