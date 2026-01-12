'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Clock, ChevronDown, AlertCircle, Loader2, Flag } from 'lucide-react';
import { useScoreHistory, formatScoreReason, formatDelta, getDeltaColor } from '@/hooks/useScoreHistory';
import { ScoreHistoryEntry } from '@/lib/api';

interface ScoreHistoryListProps {
    userId?: string;
    showHeader?: boolean;
    maxItems?: number;
    onDisputeClick?: (entry: ScoreHistoryEntry) => void;
}

export function ScoreHistoryList({ 
    userId, 
    showHeader = true, 
    maxItems,
    onDisputeClick 
}: ScoreHistoryListProps) {
    const {
        history,
        summary,
        isLoading,
        error,
        hasMore,
        loadMore,
        refresh
    } = useScoreHistory({ userId, pageSize: maxItems || 10 });

    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (isLoading && history.length === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading score history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
                <button onClick={refresh} className="ml-auto text-red-600 hover:text-red-800 underline">
                    Retry
                </button>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No score history yet.</p>
                <p className="text-sm mt-1">Your reliability score changes will appear here.</p>
            </div>
        );
    }

    const displayHistory = maxItems ? history.slice(0, maxItems) : history;

    return (
        <div className="space-y-4">
            {showHeader && summary && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Reliability Score</h3>
                            <p className="text-sm text-gray-600">
                                {summary.attendedCount} attended · {summary.noShowCount} no-shows · {summary.gamesCount} total games
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-emerald-600">
                                {summary.currentScore.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                                {summary.attendanceRate.toFixed(0)}% attendance rate
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {displayHistory.map((entry) => {
                    const { label, color, icon } = formatScoreReason(entry.reason);
                    const isExpanded = expandedId === entry.scoreHistoryId;
                    const isNoShow = entry.reason === 'NO_SHOW';

                    return (
                        <div
                            key={entry.scoreHistoryId}
                            className={`bg-white rounded-lg border ${isNoShow ? 'border-red-100' : 'border-gray-200'} overflow-hidden transition-all`}
                        >
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpandedId(isExpanded ? null : entry.scoreHistoryId)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            entry.delta >= 0 ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                            {entry.delta >= 0 ? (
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <TrendingDown className="w-5 h-5 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${color}`}>
                                                    {icon} {label}
                                                </span>
                                                {entry.gameTitle && (
                                                    <span className="text-gray-500">·</span>
                                                )}
                                                {entry.gameTitle && entry.gameId && (
                                                    <Link
                                                        href={`/games/${entry.gameId}`}
                                                        className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {entry.gameTitle}
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(entry.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className={`text-lg font-semibold ${getDeltaColor(entry.delta)}`}>
                                                {formatDelta(entry.delta)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {entry.previousScore.toFixed(1)}% → {entry.newScore.toFixed(1)}%
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
                                    <div className="pt-3 space-y-2 text-sm">
                                        {entry.description && (
                                            <p className="text-gray-600">{entry.description}</p>
                                        )}
                                        {entry.createdByDisplayName && (
                                            <p className="text-gray-500">
                                                Confirmed by: <span className="font-medium">{entry.createdByDisplayName}</span>
                                            </p>
                                        )}
                                        
                                        {/* US 2.7: Report Issue / Dispute button for no-shows */}
                                        {isNoShow && onDisputeClick && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDisputeClick(entry);
                                                }}
                                                className="mt-2 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
                                            >
                                                <Flag className="w-4 h-4" />
                                                Report Issue
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Load more button */}
            {hasMore && !maxItems && (
                <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="w-full py-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            Load More
                        </>
                    )}
                </button>
            )}

            {/* View all link if maxItems is set */}
            {maxItems && history.length > maxItems && (
                <Link
                    href={userId ? `/profile/${userId}/score-history` : '/profile/score-history'}
                    className="block text-center text-emerald-600 hover:text-emerald-700 text-sm font-medium py-2"
                >
                    View Full History →
                </Link>
            )}
        </div>
    );
}

// Helper to format date nicely
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Compact version for profile sidebar
export function ScoreHistoryCompact({ userId }: { userId?: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Score History</h2>
            <ScoreHistoryList userId={userId} showHeader={false} maxItems={5} />
        </div>
    );
}
