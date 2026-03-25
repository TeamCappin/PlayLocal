'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { StatsResponse } from '@/lib/api';
import { MetricTooltip } from '@/components/stats/MetricTooltip';
import { EmptyStatCard } from '@/components/stats/EmptyStatCard';

interface AttendanceRateCardProps {
  data: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Displays the Attendance Rate metric as a progress bar row, matching the
 * "Performance Stats" design from the profile page.
 */
export function AttendanceRateCard({ data, isLoading, error }: AttendanceRateCardProps) {
  if (isLoading && !data) {
    return (
      <div data-testid="attendance-rate-skeleton" className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  const isRefreshing = isLoading && data !== null;
  const isEmpty = !data || data.empty || data.value === null;

  if (error || isEmpty) {
    return (
      <div data-testid="attendance-rate-empty">
        <EmptyStatCard
          icon={<span className="text-gray-300 text-lg">—</span>}
          title="No attendance data yet"
          message={error ?? 'Sign up for events to start tracking your attendance.'}
          minHeight="min-h-[60px]"
        />
      </div>
    );
  }

  const value = data.value as number;

  return (
    <div
      data-testid="attendance-rate-card"
      className={`transition-opacity duration-200${isRefreshing ? ' opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">Attendance Rate</span>
        <span className="text-gray-900">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <MetricTooltip
        content="How often you showed up to events you signed up for. Calculated as games you attended divided by your total confirmed games, including no-shows."
        label="Attendance Rate information"
      />
    </div>
  );
}
