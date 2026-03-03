import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkillTrendChart } from '../../../components/stats/SkillTrendChart';
import { StatsResponse } from '../../../lib/api';

// Mock recharts – same pattern used throughout the project
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart:           ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line:                () => <div data-testid="recharts-line" />,
  XAxis:               () => <div data-testid="recharts-xaxis" />,
  YAxis:               () => <div data-testid="recharts-yaxis" />,
  CartesianGrid:       () => <div data-testid="recharts-grid" />,
  Tooltip:             () => <div data-testid="recharts-tooltip" />,
}));

// Mock MetricTooltip – avoids Radix portal / pointer-events issues in jsdom
jest.mock('@/components/stats/MetricTooltip', () => ({
  MetricTooltip: ({ label }: any) => (
    <button data-testid="metric-tooltip-trigger" aria-label={label} />
  ),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="icon-trend-up" />,
}));

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const dataResponse = (overrides: Partial<StatsResponse> = {}): StatsResponse => ({
  metric: 'skill_trend',
  value: 92.0,
  timeframe: '30',
  dataPoints: [
    { date: '2025-11-01T10:00:00Z', value: 85.0 },
    { date: '2025-12-01T10:00:00Z', value: 90.0 },
    { date: '2026-01-01T10:00:00Z', value: 92.0 },
  ],
  empty: false,
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SkillTrendChart', () => {
  describe('Loading state', () => {
    it('renders skeleton when isLoading is true', () => {
      render(<SkillTrendChart data={null} isLoading={true} error={null} />);
      expect(screen.getByTestId('skill-trend-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('skill-trend-chart')).not.toBeInTheDocument();
    });

    it('does not render the chart while loading', () => {
      render(<SkillTrendChart data={null} isLoading={true} error={null} />);
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty state when data is null and not loading', () => {
      render(<SkillTrendChart data={null} isLoading={false} error={null} />);
      expect(screen.getByTestId('skill-trend-empty')).toBeInTheDocument();
      expect(screen.getByText('No skill trend data yet')).toBeInTheDocument();
    });

    it('renders empty state when data.empty is true', () => {
      render(
        <SkillTrendChart
          data={dataResponse({ empty: true, value: null as unknown as number, dataPoints: [] })}
          isLoading={false}
          error={null}
        />,
      );
      expect(screen.getByTestId('skill-trend-empty')).toBeInTheDocument();
    });

    it('renders empty state when dataPoints is an empty array', () => {
      render(
        <SkillTrendChart
          data={dataResponse({ dataPoints: [] })}
          isLoading={false}
          error={null}
        />,
      );
      expect(screen.getByTestId('skill-trend-empty')).toBeInTheDocument();
    });

    it('shows error text in empty state when error is provided', () => {
      render(<SkillTrendChart data={null} isLoading={false} error="Server error" />);
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('shows guidance copy when no error and no data', () => {
      render(<SkillTrendChart data={null} isLoading={false} error={null} />);
      expect(
        screen.getByText('Play more games to see how your skill rating changes over time.'),
      ).toBeInTheDocument();
    });
  });

  describe('Data state', () => {
    it('renders metric tooltip trigger on the chart', () => {
      render(<SkillTrendChart data={dataResponse()} isLoading={false} error={null} />);
      const trigger = screen.getByTestId('metric-tooltip-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label', 'Skill Trend information');
    });

    it('renders the chart container with data', () => {
      render(<SkillTrendChart data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByTestId('skill-trend-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('shows current score as the headline value', () => {
      render(<SkillTrendChart data={dataResponse({ value: 92.0 })} isLoading={false} error={null} />);
      expect(screen.getByText('92.0')).toBeInTheDocument();
    });

    it('shows "Skill Trend" heading', () => {
      render(<SkillTrendChart data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByText('Skill Trend')).toBeInTheDocument();
    });

    it('shows "reliability score" label', () => {
      render(<SkillTrendChart data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByText('reliability score')).toBeInTheDocument();
    });

    it('shows improving badge when last data point is higher than first', () => {
      render(<SkillTrendChart data={dataResponse()} isLoading={false} error={null} />);
      // 85 → 92: delta = +7 → "Improving"
      expect(screen.getByText('▲ Improving')).toBeInTheDocument();
    });

    it('shows declining badge when last data point is lower than first', () => {
      const d = dataResponse({
        value: 60.0,
        dataPoints: [
          { date: '2025-11-01T10:00:00Z', value: 90.0 },
          { date: '2026-01-01T10:00:00Z', value: 60.0 },
        ],
      });
      render(<SkillTrendChart data={d} isLoading={false} error={null} />);
      expect(screen.getByText('▼ Declining')).toBeInTheDocument();
    });

    it('shows stable badge when delta is within ±1', () => {
      const d = dataResponse({
        value: 90.5,
        dataPoints: [
          { date: '2025-11-01T10:00:00Z', value: 90.0 },
          { date: '2026-01-01T10:00:00Z', value: 90.5 },
        ],
      });
      render(<SkillTrendChart data={d} isLoading={false} error={null} />);
      expect(screen.getByText('● Stable')).toBeInTheDocument();
    });

    it('does not show a trend badge when only one data point exists', () => {
      const d = dataResponse({
        dataPoints: [{ date: '2025-11-01T10:00:00Z', value: 90.0 }],
      });
      render(<SkillTrendChart data={d} isLoading={false} error={null} />);
      expect(screen.queryByText('▲ Improving')).not.toBeInTheDocument();
      expect(screen.queryByText('▼ Declining')).not.toBeInTheDocument();
      expect(screen.queryByText('● Stable')).not.toBeInTheDocument();
    });

    it('shows "all time" label for all-time timeframe', () => {
      render(
        <SkillTrendChart data={dataResponse({ timeframe: 'all' })} isLoading={false} error={null} />,
      );
      expect(screen.getByText(/Last all time/)).toBeInTheDocument();
    });

    it('shows "30 days" label for 30-day timeframe', () => {
      render(<SkillTrendChart data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByText(/Last 30 days/)).toBeInTheDocument();
    });

    it('shows correct data point count', () => {
      render(<SkillTrendChart data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByText(/3 data points/)).toBeInTheDocument();
    });
  });
});
