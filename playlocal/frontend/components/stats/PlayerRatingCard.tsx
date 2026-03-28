'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { StatsResponse } from '@/lib/api';
import { MetricTooltip } from '@/components/stats/MetricTooltip';
import { EmptyStatCard } from '@/components/stats/EmptyStatCard';
import { Star } from 'lucide-react';

interface PlayerRatingCardProps {
  data: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function PlayerRatingCard({ data, isLoading, error }: Readonly<PlayerRatingCardProps>) {
  if (isLoading && !data) {
    return (
      <div data-testid="player-rating-card-skeleton" className="space-y-4 pt-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  const isRefreshing = isLoading && data !== null;
  const isEmpty = !data || data.empty || data.value === null;

  if (error || isEmpty) {
    return (
      <div data-testid="player-rating-card-empty" className="pt-4">
        <EmptyStatCard
          icon={<Star className="text-gray-300 w-5 h-5" />}
          title="No ratings received yet"
          message={error ?? 'Complete matches and receive ratings from peers.'}
          minHeight="min-h-[80px]"
        />
      </div>
    );
  }

  const value = data.value as number;
  const count = data.dataPoints?.length || 0;

  // Convert to full 100 percentage for the progress bar based on 5-star scale
  const percentage = (value / 5) * 100;

  return (
    <div
      data-testid="player-rating-card"
      className={`transition-opacity duration-200 mt-4 ${isRefreshing ? ' opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400 fill-current" />
          <span className="text-gray-600 font-medium">Player Rating</span>
        </div>
        <span className="text-gray-900 font-bold text-lg">
          {value.toFixed(1)} <span className="text-sm font-normal text-gray-500">/ 5.0</span>
          {count > 0 && <span className="text-xs text-gray-400 ml-2">({count} ratings)</span>}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <MetricTooltip
        content="Average rating given to you by other players in completed matches. Ratings are on a 1-5 scale and evaluate overall sportsmanship and attitude."
        label="Player Rating information"
      />
    </div>
  );
}