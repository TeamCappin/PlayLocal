'use client';

import React from 'react';

interface EmptyStatCardProps {
  /**
   * Icon element rendered at the top of the card.
   * Wrap a Lucide icon and pass it here — e.g. `<TrendingUp className="w-8 h-8 text-gray-300" />`.
   */
  icon: React.ReactNode;
  /**
   * Short heading that names the problem, e.g. "No games recorded yet".
   */
  title: string;
  /**
   * One-sentence encouraging guidance that explains how to generate data.
   * Also used to surface API error messages to the user.
   */
  message: string;
  /**
   * Optional Tailwind min-height class. Defaults to "min-h-[140px]".
   * Pass "min-h-[240px]" for wider chart-sized cards.
   */
  minHeight?: string;
  /** Forwarded to the root element for test and accessibility selection. */
  'data-testid'?: string;
}

/**
 * Standardised empty-state panel used by every stats metric card/chart.
 *
 * Renders a centred icon + heading + guidance message inside a dashed-border
 * card. All three props are required so copy is always intentional per metric.
 */
export function EmptyStatCard({
  icon,
  title,
  message,
  minHeight = 'min-h-[140px]',
  'data-testid': testId,
}: EmptyStatCardProps) {
  return (
    <div
      data-testid={testId}
      className={`bg-white rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2 text-center ${minHeight}`}
    >
      {icon}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-400">{message}</p>
    </div>
  );
}
