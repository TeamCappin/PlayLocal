import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyStatCard } from '../../../components/stats/EmptyStatCard';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EmptyStatCard', () => {
  describe('Content rendering', () => {
    it('renders the title text', () => {
      render(
        <EmptyStatCard
          icon={<div data-testid="icon" />}
          title="No games recorded yet"
          message="Join a match to start tracking your show-up rate."
        />,
      );
      expect(screen.getByText('No games recorded yet')).toBeInTheDocument();
    });

    it('renders the message text', () => {
      render(
        <EmptyStatCard
          icon={<div data-testid="icon" />}
          title="No games recorded yet"
          message="Join a match to start tracking your show-up rate."
        />,
      );
      expect(
        screen.getByText('Join a match to start tracking your show-up rate.'),
      ).toBeInTheDocument();
    });

    it('renders the icon element', () => {
      render(
        <EmptyStatCard
          icon={<div data-testid="test-icon" />}
          title="No data"
          message="Some guidance."
        />,
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('data-testid forwarding', () => {
    it('forwards data-testid to the root element', () => {
      render(
        <EmptyStatCard
          data-testid="show-up-rate-empty"
          icon={<div />}
          title="No data"
          message="Some guidance."
        />,
      );
      expect(screen.getByTestId('show-up-rate-empty')).toBeInTheDocument();
    });

    it('renders without a testid when none is provided', () => {
      const { container } = render(
        <EmptyStatCard icon={<div />} title="No data" message="Some guidance." />,
      );
      // Root element should exist but have no data-testid attribute
      expect(container.firstChild).not.toHaveAttribute('data-testid');
    });
  });

  describe('minHeight prop', () => {
    it('defaults to min-h-[140px] when minHeight is not provided', () => {
      const { container } = render(
        <EmptyStatCard icon={<div />} title="No data" message="Some guidance." />,
      );
      expect(container.firstChild).toHaveClass('min-h-[140px]');
    });

    it('applies a custom minHeight class when provided', () => {
      const { container } = render(
        <EmptyStatCard
          icon={<div />}
          title="No data"
          message="Some guidance."
          minHeight="min-h-[240px]"
        />,
      );
      expect(container.firstChild).toHaveClass('min-h-[240px]');
      expect(container.firstChild).not.toHaveClass('min-h-[140px]');
    });
  });

  describe('Per-metric copy', () => {
    it('renders show-up rate empty-state copy', () => {
      render(
        <EmptyStatCard
          data-testid="show-up-rate-empty"
          icon={<div />}
          title="No games recorded yet"
          message="Join a match to start tracking your show-up rate."
        />,
      );
      expect(screen.getByText('No games recorded yet')).toBeInTheDocument();
      expect(
        screen.getByText('Join a match to start tracking your show-up rate.'),
      ).toBeInTheDocument();
    });

    it('renders skill trend empty-state copy', () => {
      render(
        <EmptyStatCard
          data-testid="skill-trend-empty"
          icon={<div />}
          title="No skill trend data yet"
          message="Play more games to see how your skill rating changes over time."
        />,
      );
      expect(screen.getByText('No skill trend data yet')).toBeInTheDocument();
      expect(
        screen.getByText('Play more games to see how your skill rating changes over time.'),
      ).toBeInTheDocument();
    });

    it('renders attendance rate empty-state copy', () => {
      render(
        <EmptyStatCard
          data-testid="attendance-rate-empty"
          icon={<div />}
          title="No attendance data yet"
          message="Sign up for events to start tracking your attendance."
        />,
      );
      expect(screen.getByText('No attendance data yet')).toBeInTheDocument();
      expect(
        screen.getByText('Sign up for events to start tracking your attendance.'),
      ).toBeInTheDocument();
    });

    it('surfaces an API error message in place of the default guidance text', () => {
      render(
        <EmptyStatCard
          icon={<div />}
          title="No games recorded yet"
          message="Failed to load show-up rate"
        />,
      );
      expect(screen.getByText('Failed to load show-up rate')).toBeInTheDocument();
    });
  });
});
