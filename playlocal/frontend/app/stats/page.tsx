'use client';

import { WinRateCard } from '@/components/stats/WinRateCard';
import { AttendanceRateCard } from '@/components/stats/AttendanceRateCard';
import { SkillTrendChart } from '@/components/stats/SkillTrendChart';
import { TimeframeToggle } from '@/components/stats/TimeframeToggle';
import { useStats } from '@/hooks/useStats';

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
        <div className="mb-6">
          <TimeframeToggle value={timeframe} onChange={setTimeframe} />
        </div>

        {/* ── Performance Stats card ─────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-xl text-gray-900 mb-6">Performance Stats</h2>
          <div className="space-y-4">
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
        </div>

        {/* ── Skill Evolution chart ───────────────────────────── */}
        <SkillTrendChart
          data={skillTrend.data}
          isLoading={skillTrend.isLoading}
          error={skillTrend.error}
        />
      </div>
    </main>
  );
}
