import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WinRateCard } from '../../../components/stats/WinRateCard';
import { StatsResponse } from '../../../lib/api';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  TrendingUp:   () => <div data-testid="icon-trend-up" />,
  TrendingDown: () => <div data-testid="icon-trend-down" />,
  Minus:        () => <div data-testid="icon-minus" />,
}));

// Skeleton renders a div so no special mock needed

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const dataResponse = (overrides: Partial<StatsResponse> = {}): StatsResponse => ({
  metric: 'win_rate',
  value: 75.0,
  timeframe: '30',
  dataPoints: [
    { date: '2025-01', value: 60.0 },
    { date: '2025-02', value: 75.0 },
  ],
  empty: false,
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WinRateCard', () => {
  describe('Loading state', () => {
    it('renders skeleton when isLoading is true', () => {
      render(<WinRateCard data={null} isLoading={true} error={null} />);
      expect(screen.getByTestId('win-rate-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('win-rate-card')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty state when data is null and not loading', () => {
      render(<WinRateCard data={null} isLoading={false} error={null} />);
      expect(screen.getByTestId('win-rate-empty')).toBeInTheDocument();
      expect(screen.getByText('No win rate data yet')).toBeInTheDocument();
    });

    it('renders empty state when data.empty is true', () => {
      render(
        <WinRateCard
          data={dataResponse({ empty: true, value: null as unknown as number, dataPoints: [] })}
          isLoading={false}
          error={null}
        />,
      );
      expect(screen.getByTestId('win-rate-empty')).toBeInTheDocument();
    });

    it('shows error message in empty state when error is provided', () => {
      render(<WinRateCard data={null} isLoading={false} error="Network error" />);
      expect(screen.getByTestId('win-rate-empty')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('Data state', () => {
    it('renders the win rate card with correct value', () => {
      render(<WinRateCard data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByTestId('win-rate-card')).toBeInTheDocument();
      expect(screen.getByText('75.0')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
    });

    it('shows "30 days" label for 30-day timeframe', () => {
      render(<WinRateCard data={dataResponse({ timeframe: '30' })} isLoading={false} error={null} />);
      expect(screen.getByText(/Last 30 days/)).toBeInTheDocument();
    });

    it('shows "all time" label for all-time timeframe', () => {
      render(<WinRateCard data={dataResponse({ timeframe: 'all' })} isLoading={false} error={null} />);
      expect(screen.getByText(/Last all time/)).toBeInTheDocument();
    });

    it('shows trending-up indicator when last month is higher than first', () => {
      const d = dataResponse({
        dataPoints: [
          { date: '2025-01', value: 40.0 },
          { date: '2025-02', value: 80.0 },
        ],
      });
      render(<WinRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByTestId('trend-up')).toBeInTheDocument();
      expect(screen.queryByTestId('trend-down')).not.toBeInTheDocument();
    });

    it('shows trending-down indicator when last month is lower than first', () => {
      const d = dataResponse({
        dataPoints: [
          { date: '2025-01', value: 90.0 },
          { date: '2025-02', value: 50.0 },
        ],
      });
      render(<WinRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByTestId('trend-down')).toBeInTheDocument();
    });

    it('shows stable indicator when delta is within ±1', () => {
      const d = dataResponse({
        dataPoints: [
          { date: '2025-01', value: 70.0 },
          { date: '2025-02', value: 70.5 },
        ],
      });
      render(<WinRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByTestId('trend-flat')).toBeInTheDocument();
    });

    it('shows stable indicator when only one data point exists (no trend possible)', () => {
      const d = dataResponse({
        dataPoints: [{ date: '2025-01', value: 70.0 }],
      });
      render(<WinRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByTestId('trend-flat')).toBeInTheDocument();
    });

    it('shows "2 months of data" for two data points', () => {
      render(<WinRateCard data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByText(/2 months of data/)).toBeInTheDocument();
    });

    it('shows "1 month of data" (singular) for one data point', () => {
      const d = dataResponse({ dataPoints: [{ date: '2025-01', value: 70.0 }] });
      render(<WinRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByText(/1 month of data/)).toBeInTheDocument();
    });
  });
});
