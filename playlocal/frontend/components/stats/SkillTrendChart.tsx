'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsResponse, StatsDataPoint } from '@/lib/api';
import { MetricTooltip } from '@/components/stats/MetricTooltip';
import { EmptyStatCard } from '@/components/stats/EmptyStatCard';

interface SkillTrendChartProps {
  data: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Renders the Skill Evolution chart, matching the profile page design language.
 */
export function SkillTrendChart({ data, isLoading, error }: SkillTrendChartProps) {
  if (isLoading && !data) {
    return (
      <div
        data-testid="skill-trend-skeleton"
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <Skeleton className="h-6 w-40 mb-6" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  const isRefreshing = isLoading && data !== null;

  const isEmpty = !data || data.empty || data.dataPoints.length === 0;

  if (error || isEmpty) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <EmptyStatCard
          data-testid="skill-trend-empty"
          icon={<TrendingUp className="w-10 h-10 text-gray-300" />}
          title="No skill trend data yet"
          message={error ?? 'Play more games to see how your skill rating changes over time.'}
          minHeight="min-h-[240px]"
        />
      </div>
    );
  }

  const chartData = formatChartData(data.dataPoints);

  return (
    <div
      data-testid="skill-trend-chart"
      className={`bg-white rounded-xl border border-gray-200 p-6 transition-opacity duration-200${isRefreshing ? ' opacity-60' : ''}`}
    >
      <h2 className="text-xl text-gray-900 mb-6">Skill Evolution</h2>

      <div data-testid="skill-trend-recharts">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <MetricTooltip
        content="Your skill evolution based on the skill level and intensity of games you've played. 100 = Advanced & Competitive, 0 = Beginner & Beginner-Friendly. Games marked 'All Levels Welcome' are not counted."
        label="Skill Trend information"
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format data points for the chart. */
function formatChartData(pts: StatsDataPoint[]) {
  return pts.map((pt) => ({
    label: formatAxisLabel(pt.date),
    value: pt.value,
    rawDate: pt.date,
  }));
}

/**
 * Convert an ISO-8601 instant like "2025-11-03T10:00:00Z" to a short label "Nov 3".
 * If the string is a "yyyy-MM" month, show "Nov 25".
 */
function formatAxisLabel(dateStr: string): string {
  try {
    const isYearMonth = /^\d{4}-\d{2}$/.test(dateStr);
    // Use noon to avoid timezone shift on rendering
    const parseableStr = isYearMonth ? `${dateStr}-01T12:00:00` : dateStr;
    const d = new Date(parseableStr);
    if (isNaN(d.getTime())) return dateStr;
    
    if (isYearMonth) {
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
