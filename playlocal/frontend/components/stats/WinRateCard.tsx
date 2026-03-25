'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { StatsResponse } from '@/lib/api';
import { MetricTooltip } from '@/components/stats/MetricTooltip';
import { EmptyStatCard } from '@/components/stats/EmptyStatCard';

interface WinRateCardProps {
  data: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Displays the Show-up Rate metric as a progress bar row, matching the
 * "Performance Stats" design from the profile page.
 */
export function WinRateCard({ data, isLoading, error }: WinRateCardProps) {
  if (isLoading && !data) {
    return (
      <div data-testid="win-rate-skeleton" className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  const isRefreshing = isLoading && data !== null;
  const isEmpty = !data || data.empty || data.value === null;

  if (error || isEmpty) {
    return (
      <div data-testid="win-rate-empty">
        <EmptyStatCard
          icon={<span className="text-gray-300 text-lg">—</span>}
          title="No games recorded yet"
          message={error ?? 'Join a match to start tracking your show-up rate.'}
          minHeight="min-h-[60px]"
        />
      </div>
    );
  }

  const value = data.value as number;

  return (
    <div
      data-testid="win-rate-card"
      className={`transition-opacity duration-200${isRefreshing ? ' opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">Show-up Rate</span>
        <span className="text-gray-900">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <MetricTooltip
        content="Percentage of your confirmed games where you successfully showed up. No-shows and unknown attendance negatively impact this score."
        label="Show-up Rate information"
      />
    </div>
  );
}
