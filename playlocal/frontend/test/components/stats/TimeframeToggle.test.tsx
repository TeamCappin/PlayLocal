import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimeframeToggle } from '../../../components/stats/TimeframeToggle';
import { StatsTimeframe } from '../../../lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderToggle(value: StatsTimeframe = '30', onChange = jest.fn()) {
  return { onChange, ...render(<TimeframeToggle value={value} onChange={onChange} />) };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TimeframeToggle', () => {
  describe('Rendering', () => {
    it('renders all three option buttons', () => {
      renderToggle();
      expect(screen.getByTestId('timeframe-30')).toBeInTheDocument();
      expect(screen.getByTestId('timeframe-90')).toBeInTheDocument();
      expect(screen.getByTestId('timeframe-all')).toBeInTheDocument();
    });

    it('renders the group with an accessible label', () => {
      renderToggle();
      expect(screen.getByRole('group', { name: 'Select timeframe' })).toBeInTheDocument();
    });

    it('renders with a container data-testid', () => {
      renderToggle();
      expect(screen.getByTestId('timeframe-toggle')).toBeInTheDocument();
    });

    it('button labels are 30d, 90d, All', () => {
      renderToggle();
      expect(screen.getByText('30d')).toBeInTheDocument();
      expect(screen.getByText('90d')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  describe('Active state', () => {
    it('marks the 30d button as active by default (aria-pressed="true")', () => {
      renderToggle('30');
      expect(screen.getByTestId('timeframe-30')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('timeframe-90')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('timeframe-all')).toHaveAttribute('aria-pressed', 'false');
    });

    it('marks the 90d button as active when value is "90"', () => {
      renderToggle('90');
      expect(screen.getByTestId('timeframe-90')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('timeframe-30')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('timeframe-all')).toHaveAttribute('aria-pressed', 'false');
    });

    it('marks the All button as active when value is "all"', () => {
      renderToggle('all');
      expect(screen.getByTestId('timeframe-all')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('timeframe-30')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('timeframe-90')).toHaveAttribute('aria-pressed', 'false');
    });

    it('only one button is active at a time', () => {
      renderToggle('90');
      const pressed = screen
        .getAllByRole('button')
        .filter((btn) => btn.getAttribute('aria-pressed') === 'true');
      expect(pressed).toHaveLength(1);
    });
  });

  describe('Interaction', () => {
    it('calls onChange with "90" when the 90d button is clicked', () => {
      const { onChange } = renderToggle('30');
      fireEvent.click(screen.getByTestId('timeframe-90'));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('90');
    });

    it('calls onChange with "all" when the All button is clicked', () => {
      const { onChange } = renderToggle('30');
      fireEvent.click(screen.getByTestId('timeframe-all'));
      expect(onChange).toHaveBeenCalledWith('all');
    });

    it('calls onChange with "30" when the 30d button is clicked', () => {
      const { onChange } = renderToggle('all');
      fireEvent.click(screen.getByTestId('timeframe-30'));
      expect(onChange).toHaveBeenCalledWith('30');
    });

    it('calls onChange even when clicking the already-active button', () => {
      const { onChange } = renderToggle('30');
      fireEvent.click(screen.getByTestId('timeframe-30'));
      expect(onChange).toHaveBeenCalledWith('30');
    });

    it('reflects updated value when re-rendered with a new value prop', () => {
      const { rerender } = renderToggle('30');
      expect(screen.getByTestId('timeframe-30')).toHaveAttribute('aria-pressed', 'true');

      rerender(<TimeframeToggle value="90" onChange={jest.fn()} />);
      expect(screen.getByTestId('timeframe-90')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('timeframe-30')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Accessibility', () => {
    it('all buttons have type="button" to prevent accidental form submission', () => {
      renderToggle();
      screen.getAllByRole('button').forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });
  });
});
