'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface MetricTooltipProps {
  /**
   * Plain-language explanation of what the metric means and how it is calculated.
   * Displayed inside the tooltip panel.
   */
  content: string;
  /**
   * Concise accessible label for the trigger button, e.g. "Win Rate information".
   * Read aloud by screen readers instead of the icon character.
   */
  label: string;
}

/**
 * OQS-style expandable explanation row for a metric.
 */
export function MetricTooltip({ content, label }: MetricTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const title = label.toLowerCase().endsWith(' information')
    ? label.slice(0, -12).trimEnd()
    : label;

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        data-testid="metric-tooltip-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-sm text-gray-600 transition-colors hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4" aria-hidden="true" />
          How is {title} calculated?
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>

      {isOpen && (
        <div
          role="tooltip"
          data-testid="metric-tooltip-content"
          className="mt-3"
        >
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs leading-relaxed text-gray-600">{content}</p>
          </div>
        </div>
      )}
    </div>
  );
}
