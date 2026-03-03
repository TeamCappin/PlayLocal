'use client';

import { WinRateCard } from '@/components/stats/WinRateCard';
import { AttendanceRateCard } from '@/components/stats/AttendanceRateCard';
import { SkillTrendChart } from '@/components/stats/SkillTrendChart';
import { useStats } from '@/hooks/useStats';
import { StatsTimeframe } from '@/lib/api';

const TIMEFRAMES: { label: string; value: StatsTimeframe }[] = [
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
  { label: 'All time', value: 'all' },
];

/**
 * Stats & Analytics Dashboard page.
 * Route: /stats
 * US-7.6: Dashboard + Metric Explanations
 */
export default function StatsPage() {
  const { winRate, skillTrend, attendanceRate, timeframe, setTimeframe } = useStats();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Stats &amp; Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your performance and progression over time.
          </p>
        </div>

        {/* ── Timeframe toggle ────────────────────────────────── */}
        <div
          role="group"
          aria-label="Select timeframe"
          className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm mb-6"
        >
          {TIMEFRAMES.map(({ label, value }) => (
            <button
              key={value}
              data-testid={`timeframe-${value}`}
              onClick={() => setTimeframe(value)}
              aria-pressed={timeframe === value}
              className={[
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                timeframe === value
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Metric cards grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <WinRateCard
            data={winRate.data}
            isLoading={winRate.isLoading}
            error={winRate.error}
          />
          <AttendanceRateCard
            data={attendanceRate.data}
            isLoading={attendanceRate.isLoading}
            error={attendanceRate.error}
          />
        </div>

        {/* ── Skill trend chart (full width) ──────────────────── */}
        <SkillTrendChart
          data={skillTrend.data}
          isLoading={skillTrend.isLoading}
          error={skillTrend.error}
        />
      </div>
    </main>
  );
}
