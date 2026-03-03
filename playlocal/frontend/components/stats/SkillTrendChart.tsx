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

interface SkillTrendChartProps {
  data: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Renders the Skill (reliability score) Trend as a line chart.
 * Uses recharts directly (already installed) rather than the shadcn chart wrapper,
 * which requires a stricter config DSL not needed for this single-series chart.
 *
 * - Loading: animated skeleton placeholder preserving chart height
 * - Error or empty: shows an inline empty-state
 */
export function SkillTrendChart({ data, isLoading, error }: SkillTrendChartProps) {
  if (isLoading) {
    return (
      <div
        data-testid="skill-trend-skeleton"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4"
      >
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-[180px] w-full rounded-lg" />
      </div>
    );
  }

  const isEmpty = !data || data.empty || data.dataPoints.length === 0;

  if (error || isEmpty) {
    return (
      <div
        data-testid="skill-trend-empty"
        className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[240px]"
      >
        <TrendingUp className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No skill trend data yet</p>
        <p className="text-xs text-gray-400">
          {error ?? 'Play more games to see how your skill rating changes over time.'}
        </p>
      </div>
    );
  }

  const chartData = formatChartData(data.dataPoints);
  const currentScore = data.value !== null ? (data.value as number).toFixed(1) : '–';
  const trend = getTrendLabel(data.dataPoints);

  return (
    <div
      data-testid="skill-trend-chart"
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Skill Trend
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl font-bold text-gray-900">{currentScore}</span>
            <span className="text-sm text-gray-500">reliability score</span>
          </div>
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.className}`}>
            {trend.label}
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="h-[180px] w-full" data-testid="skill-trend-recharts">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
              }}
              formatter={(val: number) => [`${val.toFixed(1)}`, 'Score']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-400">
        Last {data.timeframe === 'all' ? 'all time' : `${data.timeframe} days`} ·{' '}
        {data.dataPoints.length} data point{data.dataPoints.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format ISO-instant data points for the chart.  */
function formatChartData(pts: StatsDataPoint[]) {
  return pts.map((pt) => ({
    label: formatAxisLabel(pt.date),
    value: pt.value,
    rawDate: pt.date,
  }));
}

/**
 * Convert an ISO-8601 instant like "2025-11-03T10:00:00Z" to a short label "Nov 3".
 * If the string is already a "yyyy-MM" month, show "Nov 25".
 */
function formatAxisLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getTrendLabel(pts: StatsDataPoint[]) {
  if (pts.length < 2) return null;
  const delta = pts[pts.length - 1].value - pts[0].value;
  if (delta > 1) return { label: '▲ Improving', className: 'bg-emerald-50 text-emerald-700' };
  if (delta < -1) return { label: '▼ Declining', className: 'bg-red-50 text-red-600' };
  return { label: '● Stable', className: 'bg-gray-50 text-gray-500' };
}
