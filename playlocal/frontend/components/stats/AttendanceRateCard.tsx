'use client';

import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsResponse } from '@/lib/api';

interface AttendanceRateCardProps {
  data: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Displays the Attendance Rate metric as a large percentage with a trend indicator.
 *
 * - Loading: animated skeleton placeholder
 * - Error or empty: shows an inline empty-state (full empty-state guidance is
 *   handled by the parent page / Task 5 component)
 */
export function AttendanceRateCard({ data, isLoading, error }: AttendanceRateCardProps) {
  if (isLoading) {
    return (
      <div
        data-testid="attendance-rate-skeleton"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4"
      >
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  const isEmpty = !data || data.empty || data.value === null;

  if (error || isEmpty) {
    return (
      <div
        data-testid="attendance-rate-empty"
        className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[140px]"
      >
        <Users className="w-8 h-8 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No attendance data yet</p>
        <p className="text-xs text-gray-400">
          {error ?? 'Sign up for events to start tracking your attendance.'}
        </p>
      </div>
    );
  }

  const value = data.value as number;
  const trend = getTrend(data);

  return (
    <div
      data-testid="attendance-rate-card"
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-1"
    >
      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Attendance Rate
      </span>

      <div className="flex items-end gap-2 mt-1">
        <span className="text-4xl font-bold text-gray-900">
          {value.toFixed(1)}
          <span className="text-2xl">%</span>
        </span>
        <TrendIndicator trend={trend} />
      </div>

      <p className="text-xs text-gray-400 mt-1">
        Last {data.timeframe === 'all' ? 'all time' : `${data.timeframe} days`} ·{' '}
        {data.dataPoints.length} month{data.dataPoints.length !== 1 ? 's' : ''} of data
      </p>
    </div>
  );
}

// ─── Trend indicator ──────────────────────────────────────────────────────────

type TrendDirection = 'up' | 'down' | 'flat';

function getTrend(data: StatsResponse): TrendDirection {
  const pts = data.dataPoints;
  if (pts.length < 2) return 'flat';
  const first = pts[0].value;
  const last = pts[pts.length - 1].value;
  if (last > first + 1) return 'up';
  if (last < first - 1) return 'down';
  return 'flat';
}

function TrendIndicator({ trend }: { trend: TrendDirection }) {
  if (trend === 'up')
    return (
      <span
        data-testid="trend-up"
        className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 mb-1"
        aria-label="Trending up"
      >
        <TrendingUp className="w-4 h-4" />
        Up
      </span>
    );
  if (trend === 'down')
    return (
      <span
        data-testid="trend-down"
        className="flex items-center gap-0.5 text-xs font-semibold text-red-500 mb-1"
        aria-label="Trending down"
      >
        <TrendingDown className="w-4 h-4" />
        Down
      </span>
    );
  return (
    <span
      data-testid="trend-flat"
      className="flex items-center gap-0.5 text-xs font-semibold text-gray-400 mb-1"
      aria-label="Stable"
    >
      <Minus className="w-4 h-4" />
      Stable
    </span>
  );
}
