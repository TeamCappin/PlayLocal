import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShowUpRateCard } from '../../../components/stats/ShowUpRateCard';
import { StatsResponse } from '../../../lib/api';

// Mock MetricTooltip – avoids Radix portal / pointer-events issues in jsdom
jest.mock('@/components/stats/MetricTooltip', () => ({
  MetricTooltip: ({ label }: any) => (
    <button data-testid="metric-tooltip-trigger" aria-label={label} />
  ),
}));

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const dataResponse = (overrides: Partial<StatsResponse> = {}): StatsResponse => ({
  metric: 'show_up_rate',
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

describe('ShowUpRateCard', () => {
  describe('Loading state', () => {
    it('renders skeleton when isLoading is true and there is no previous data (initial load)', () => {
      render(<ShowUpRateCard data={null} isLoading={true} error={null} />);
      expect(screen.getByTestId('show-up-rate-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('show-up-rate-card')).not.toBeInTheDocument();
    });

    it('keeps previous data visible at reduced opacity when re-fetching (no layout shift)', () => {
      render(<ShowUpRateCard data={dataResponse()} isLoading={true} error={null} />);
      const card = screen.getByTestId('show-up-rate-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('opacity-60');
      expect(screen.queryByTestId('show-up-rate-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty state when data is null and not loading', () => {
      render(<ShowUpRateCard data={null} isLoading={false} error={null} />);
      expect(screen.getByTestId('show-up-rate-empty')).toBeInTheDocument();
      expect(screen.getByText('No games recorded yet')).toBeInTheDocument();
    });

    it('renders empty state when data.empty is true', () => {
      render(
        <ShowUpRateCard
          data={dataResponse({ empty: true, value: null as unknown as number, dataPoints: [] })}
          isLoading={false}
          error={null}
        />,
      );
      expect(screen.getByTestId('show-up-rate-empty')).toBeInTheDocument();
    });

    it('shows guidance copy in empty state when no error', () => {
      render(<ShowUpRateCard data={null} isLoading={false} error={null} />);
      expect(
        screen.getByText('Join a match to start tracking your show-up rate.'),
      ).toBeInTheDocument();
    });

    it('shows error message in empty state when error is provided', () => {
      render(<ShowUpRateCard data={null} isLoading={false} error="Network error" />);
      expect(screen.getByTestId('show-up-rate-empty')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('Data state', () => {
    it('renders metric tooltip trigger on the data card', () => {
      render(<ShowUpRateCard data={dataResponse()} isLoading={false} error={null} />);
      const trigger = screen.getByTestId('metric-tooltip-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label', 'Show-up Rate information');
    });

    it('renders the show-up rate card with rounded percentage value', () => {
      render(<ShowUpRateCard data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByTestId('show-up-rate-card')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Show-up Rate')).toBeInTheDocument();
    });

    it('renders a progress bar with correct width', () => {
      const { container } = render(<ShowUpRateCard data={dataResponse()} isLoading={false} error={null} />);
      const bar = container.querySelector('.bg-emerald-500');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveStyle({ width: '75%' });
    });

    it('caps progress bar width at 100%', () => {
      const d = dataResponse({ value: 150.0 });
      const { container } = render(<ShowUpRateCard data={d} isLoading={false} error={null} />);
      const bar = container.querySelector('.bg-emerald-500');
      expect(bar).toHaveStyle({ width: '100%' });
    });

    it('renders 0% progress bar for value 0', () => {
      const d = dataResponse({ value: 0 });
      const { container } = render(<ShowUpRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      const bar = container.querySelector('.bg-emerald-500');
      expect(bar).toHaveStyle({ width: '0%' });
    });
  });
});
