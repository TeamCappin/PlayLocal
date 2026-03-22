'use client';

import { useState } from 'react';
import {
  Info,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useOrganizerQuality,
  formatOqsScore,
  getOqsColorClass,
  getOqsBgColorClass,
  getConfidenceLevelInfo,
} from '@/hooks/useOrganizerQuality';

interface OrganizerQualityBadgeProps {
  userId: string;
  displayName?: string;
  variant?: 'compact' | 'full' | 'inline';
  showInfoCard?: boolean;
}

/**
 * Organizer Quality Score (OQS) Badge Component.
 * Implements: US-6.1 - Display OQS on organizer profiles and game details pages.
 *
 * Variants:
 * - compact: Small badge showing just the score
 * - full: Full card with breakdown and info
 * - inline: Inline display for lists
 */
export function OrganizerQualityBadge({
  userId,
  displayName,
  variant = 'compact',
  showInfoCard = true,
}: OrganizerQualityBadgeProps) {
  const { oqs, infoCard, isLoading, error } = useOrganizerQuality({ userId });
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return <OqsLoadingState variant={variant} />;
  }

  if (error || !oqs) {
    return <OqsErrorState variant={variant} />;
  }

  const confidenceInfo = getConfidenceLevelInfo(oqs.confidenceLevel);

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded ${getOqsBgColorClass(oqs.oqsScore)}`}
        >
          <Star className={`w-3 h-3 ${getOqsColorClass(oqs.oqsScore)}`} />
          <span
            className={`text-sm font-medium ${getOqsColorClass(oqs.oqsScore)}`}
          >
            {formatOqsScore(oqs.oqsScore)}
          </span>
        </div>
        <span className={`text-xs ${confidenceInfo.color}`}>
          {confidenceInfo.icon}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => showInfoCard && setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getOqsBgColorClass(oqs.oqsScore)} hover:opacity-90 transition-opacity`}
        >
          <Star className={`w-4 h-4 ${getOqsColorClass(oqs.oqsScore)}`} />
          <span className={`font-semibold ${getOqsColorClass(oqs.oqsScore)}`}>
            OQS: {formatOqsScore(oqs.oqsScore)}
          </span>
          {showInfoCard && <Info className="w-4 h-4 text-gray-500" />}
        </button>

        {/* Info Card Popover */}
        {isExpanded && infoCard && showInfoCard && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <OqsInfoCardContent
              infoCard={infoCard}
              onClose={() => setIsExpanded(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${getOqsBgColorClass(oqs.oqsScore)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm`}
            >
              <Star className={`w-6 h-6 ${getOqsColorClass(oqs.oqsScore)}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Organizer Quality Score
              </h3>
              <p className="text-sm text-gray-600">
                {displayName || 'Organizer'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-3xl font-bold ${getOqsColorClass(oqs.oqsScore)}`}
            >
              {formatOqsScore(oqs.oqsScore)}
            </div>
            <div className={`text-sm ${confidenceInfo.color}`}>
              {confidenceInfo.label}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className="p-4 space-y-4">
        {/* Game Completion Rate */}
        <MetricBar
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          label="Game Completion Rate"
          value={oqs.gameCompletionRate}
          detail={`${oqs.completedGames} of ${oqs.totalGamesHosted} games completed`}
        />

        {/* Repeat Player Rate */}
        <MetricBar
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="Repeat Player Rate"
          value={oqs.repeatPlayerRate}
          detail={`${oqs.repeatPlayers} of ${oqs.totalUniquePlayers} players returned`}
        />

        {/* Confidence Indicator */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Confidence Level</span>
            <div className="flex items-center gap-2">
              <span className={confidenceInfo.color}>
                {confidenceInfo.icon}
              </span>
              <span className="text-gray-900">
                {oqs.totalGamesHosted} games hosted
              </span>
            </div>
          </div>
          {oqs.confidenceDescription && (
            <p className="text-xs text-gray-500 mt-1">
              {oqs.confidenceDescription}
            </p>
          )}
        </div>
      </div>

      {/* Expandable Info Card */}
      {showInfoCard && infoCard && (
        <div className="border-t border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              How is OQS calculated?
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isExpanded && (
            <div className="px-4 pb-4">
              <OqsExplanation infoCard={infoCard} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Metric progress bar component.
 */
function MetricBar({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{detail}</p>
    </div>
  );
}

/**
 * Info card content component.
 */
function OqsInfoCardContent({
  infoCard,
  onClose,
}: {
  infoCard: any;
  onClose: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">OQS Breakdown</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      <OqsExplanation infoCard={infoCard} />
    </div>
  );
}

/**
 * OQS explanation component.
 */
function OqsExplanation({ infoCard }: { infoCard: any }) {
  return (
    <div className="space-y-4 text-sm">
      {/* Overall Description */}
      <p className="text-gray-700">{infoCard.overallDescription}</p>

      {/* Completion Rate Explanation */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-gray-900">
            Game Completion Rate (60%)
          </span>
        </div>
        <p className="text-gray-600 text-xs">
          {infoCard.completionRateDescription}
        </p>
      </div>

      {/* Repeat Player Rate Explanation */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900">
            Repeat Player Rate (40%)
          </span>
        </div>
        <p className="text-gray-600 text-xs">
          {infoCard.repeatRateDescription}
        </p>
      </div>

      {/* Confidence Explanation */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-gray-900">
            Confidence: {infoCard.confidenceLevel}
          </span>
        </div>
        <p className="text-gray-600 text-xs">
          {infoCard.confidenceDescription}
        </p>
        {infoCard.gamesForNextLevel > 0 && (
          <p className="text-emerald-600 text-xs mt-1">
            Host {infoCard.gamesForNextLevel} more game
            {infoCard.gamesForNextLevel > 1 ? 's' : ''} to increase confidence
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Loading state component.
 */
function OqsLoadingState({ variant }: { variant: string }) {
  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="w-16 h-5 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100">
        <div className="w-4 h-4 bg-gray-300 animate-pulse rounded" />
        <div className="w-16 h-4 bg-gray-300 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded" />
        <div className="h-8 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

/**
 * Error state component.
 */
function OqsErrorState({ variant }: { variant: string }) {
  if (variant === 'inline') {
    return <span className="text-sm text-gray-400">—</span>;
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-sm">
        <Star className="w-4 h-4" />
        <span>OQS unavailable</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
      <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500">Unable to load OQS</p>
    </div>
  );
}

export default OrganizerQualityBadge;
