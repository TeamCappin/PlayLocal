'use client';

import { StatsTimeframe } from '@/lib/api';

const TIMEFRAMES: { label: string; value: StatsTimeframe }[] = [
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
  { label: 'All',  value: 'all' },
];

interface TimeframeToggleProps {
  /** Currently selected timeframe value. */
  value: StatsTimeframe;
  /** Called with the new value when the user clicks a button. */
  onChange: (tf: StatsTimeframe) => void;
}

/**
 * Button-group control that lets users switch between 30-day, 90-day, and
 * all-time views on the stats dashboard.
 *
 * Accessibility:
 *  - `role="group"` + `aria-label` labels the whole control for screen readers.
 *  - Each button carries `aria-pressed` so the active selection is announced.
 *  - Focus ring meets WCAG 2.4.7 (Focus Visible).
 */
export function TimeframeToggle({ value, onChange }: TimeframeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Select timeframe"
      data-testid="timeframe-toggle"
      className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      {TIMEFRAMES.map(({ label, value: tf }) => (
        <button
          key={tf}
          type="button"
          data-testid={`timeframe-${tf}`}
          onClick={() => onChange(tf)}
          aria-pressed={value === tf}
          className={[
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            value === tf
              ? 'bg-emerald-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
