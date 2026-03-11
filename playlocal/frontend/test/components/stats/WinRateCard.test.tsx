import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WinRateCard } from '../../../components/stats/WinRateCard';
import { StatsResponse } from '../../../lib/api';

// Mock MetricTooltip – avoids Radix portal / pointer-events issues in jsdom
jest.mock('@/components/stats/MetricTooltip', () => ({
  MetricTooltip: ({ label }: any) => (
    <button data-testid="metric-tooltip-trigger" aria-label={label} />
  ),
}));

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
    it('renders skeleton when isLoading is true and there is no previous data (initial load)', () => {
      render(<WinRateCard data={null} isLoading={true} error={null} />);
      expect(screen.getByTestId('win-rate-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('win-rate-card')).not.toBeInTheDocument();
    });

    it('keeps previous data visible at reduced opacity when re-fetching (no layout shift)', () => {
      render(<WinRateCard data={dataResponse()} isLoading={true} error={null} />);
      const card = screen.getByTestId('win-rate-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('opacity-60');
      expect(screen.queryByTestId('win-rate-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty state when data is null and not loading', () => {
      render(<WinRateCard data={null} isLoading={false} error={null} />);
      expect(screen.getByTestId('win-rate-empty')).toBeInTheDocument();
      expect(screen.getByText('No games recorded yet')).toBeInTheDocument();
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

    it('shows guidance copy in empty state when no error', () => {
      render(<WinRateCard data={null} isLoading={false} error={null} />);
      expect(
        screen.getByText('Join a match to start tracking your win rate.'),
      ).toBeInTheDocument();
    });

    it('shows error message in empty state when error is provided', () => {
      render(<WinRateCard data={null} isLoading={false} error="Network error" />);
      expect(screen.getByTestId('win-rate-empty')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('Data state', () => {
    it('renders metric tooltip trigger on the data card', () => {
      render(<WinRateCard data={dataResponse()} isLoading={false} error={null} />);
      const trigger = screen.getByTestId('metric-tooltip-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label', 'Win Rate information');
    });

    it('renders the win rate card with rounded percentage value', () => {
      render(<WinRateCard data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByTestId('win-rate-card')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
    });

    it('renders a progress bar with correct width', () => {
      const { container } = render(<WinRateCard data={dataResponse()} isLoading={false} error={null} />);
      const bar = container.querySelector('.bg-emerald-500');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveStyle({ width: '75%' });
    });

    it('caps progress bar width at 100%', () => {
      const d = dataResponse({ value: 150.0 });
      const { container } = render(<WinRateCard data={d} isLoading={false} error={null} />);
      const bar = container.querySelector('.bg-emerald-500');
      expect(bar).toHaveStyle({ width: '100%' });
    });

    it('renders 0% progress bar for value 0', () => {
      const d = dataResponse({ value: 0 });
      const { container } = render(<WinRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      const bar = container.querySelector('.bg-emerald-500');
      expect(bar).toHaveStyle({ width: '0%' });
    });
  });
});
