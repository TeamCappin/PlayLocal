'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
 * A small ⓘ icon that surfaces a tooltip with a plain-language explanation of
 * the metric on hover and keyboard focus.
 *
 * Accessibility guarantees:
 *  - Trigger is a `<button>` with an `aria-label` so screen readers announce its purpose.
 *  - Radix Tooltip automatically sets `role="tooltip"` on the content panel and
 *    manages `aria-describedby` linkage between trigger and content.
 *  - The icon carries `aria-hidden="true"` to avoid double-reading.
 *  - Visible focus ring (`focus-visible:ring-2`) meets WCAG 2.4.7 (Focus Visible).
 */
export function MetricTooltip({ content, label }: MetricTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          data-testid="metric-tooltip-trigger"
          className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full transition-colors"
        >
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        role="tooltip"
        data-testid="metric-tooltip-content"
        className="max-w-[220px] text-center leading-snug"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
