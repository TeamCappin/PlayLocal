import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AttendanceRateCard } from '../../../components/stats/AttendanceRateCard';
import { StatsResponse } from '../../../lib/api';

// Mock MetricTooltip – avoids Radix portal / pointer-events issues in jsdom
jest.mock('@/components/stats/MetricTooltip', () => ({
  MetricTooltip: ({ label }: any) => (
    <button data-testid="metric-tooltip-trigger" aria-label={label} />
  ),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Users:        () => <div data-testid="icon-users" />,
  TrendingUp:   () => <div data-testid="icon-trend-up" />,
  TrendingDown: () => <div data-testid="icon-trend-down" />,
  Minus:        () => <div data-testid="icon-minus" />,
}));

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const dataResponse = (overrides: Partial<StatsResponse> = {}): StatsResponse => ({
  metric: 'attendance_rate',
  value: 80.0,
  timeframe: '30',
  dataPoints: [
    { date: '2025-01', value: 70.0 },
    { date: '2025-02', value: 80.0 },
  ],
  empty: false,
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AttendanceRateCard', () => {
  describe('Loading state', () => {
    it('renders skeleton when isLoading is true and there is no previous data (initial load)', () => {
      render(<AttendanceRateCard data={null} isLoading={true} error={null} />);
      expect(screen.getByTestId('attendance-rate-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('attendance-rate-card')).not.toBeInTheDocument();
    });

    it('keeps previous data visible at reduced opacity when re-fetching (no layout shift)', () => {
      render(<AttendanceRateCard data={dataResponse()} isLoading={true} error={null} />);
      const card = screen.getByTestId('attendance-rate-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('opacity-60');
      expect(screen.queryByTestId('attendance-rate-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty state when data is null and not loading', () => {
      render(<AttendanceRateCard data={null} isLoading={false} error={null} />);
      expect(screen.getByTestId('attendance-rate-empty')).toBeInTheDocument();
      expect(screen.getByText('No attendance data yet')).toBeInTheDocument();
    });

    it('renders empty state when data.empty is true', () => {
      render(
        <AttendanceRateCard
          data={dataResponse({ empty: true, value: null as unknown as number, dataPoints: [] })}
          isLoading={false}
          error={null}
        />,
      );
      expect(screen.getByTestId('attendance-rate-empty')).toBeInTheDocument();
    });

    it('shows error message in empty state when error is provided', () => {
      render(<AttendanceRateCard data={null} isLoading={false} error="Request failed" />);
      expect(screen.getByText('Request failed')).toBeInTheDocument();
    });

    it('shows guidance copy in empty state when no error', () => {
      render(<AttendanceRateCard data={null} isLoading={false} error={null} />);
      expect(
        screen.getByText('Sign up for events to start tracking your attendance.'),
      ).toBeInTheDocument();
    });
  });

  describe('Data state', () => {
    it('renders metric tooltip trigger on the data card', () => {
      render(<AttendanceRateCard data={dataResponse()} isLoading={false} error={null} />);
      const trigger = screen.getByTestId('metric-tooltip-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label', 'Attendance Rate information');
    });

    it('renders the attendance rate card with correct value', () => {
      render(<AttendanceRateCard data={dataResponse()} isLoading={false} error={null} />);
      expect(screen.getByTestId('attendance-rate-card')).toBeInTheDocument();
      expect(screen.getByText('80.0')).toBeInTheDocument();
      expect(screen.getByText('Attendance Rate')).toBeInTheDocument();
    });

    it('shows "90 days" label for 90-day timeframe', () => {
      render(
        <AttendanceRateCard data={dataResponse({ timeframe: '90' })} isLoading={false} error={null} />,
      );
      expect(screen.getByText(/Last 90 days/)).toBeInTheDocument();
    });

    it('shows "all time" label for all-time timeframe', () => {
      render(
        <AttendanceRateCard data={dataResponse({ timeframe: 'all' })} isLoading={false} error={null} />,
      );
      expect(screen.getByText(/Last all time/)).toBeInTheDocument();
    });

    it('shows trending-up indicator when rate improves', () => {
      const d = dataResponse({
        dataPoints: [
          { date: '2025-01', value: 50.0 },
          { date: '2025-02', value: 90.0 },
        ],
      });
      render(<AttendanceRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByTestId('trend-up')).toBeInTheDocument();
    });

    it('shows trending-down indicator when rate drops significantly', () => {
      const d = dataResponse({
        dataPoints: [
          { date: '2025-01', value: 95.0 },
          { date: '2025-02', value: 60.0 },
        ],
      });
      render(<AttendanceRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByTestId('trend-down')).toBeInTheDocument();
    });

    it('shows stable indicator when single data point', () => {
      const d = dataResponse({ dataPoints: [{ date: '2025-01', value: 80.0 }] });
      render(<AttendanceRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByTestId('trend-flat')).toBeInTheDocument();
    });

    it('shows stable indicator when two data points differ by less than 1 (flat trend)', () => {
      const d = dataResponse({
        dataPoints: [
          { date: '2025-01', value: 80.0 },
          { date: '2025-02', value: 80.5 },
        ],
      });
      render(<AttendanceRateCard data={d} isLoading={false} error={null} />);
      expect(screen.getByTestId('trend-flat')).toBeInTheDocument();
    });
  });
});
