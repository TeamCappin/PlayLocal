'use client';

import { Filter, X } from 'lucide-react';
import type { MatchHistoryFilterState } from '@/lib/matchHistoryUtils';
import {
  clearMatchHistoryFilterFields,
  hasActiveMatchHistoryFilters,
  uniqueSportNames,
} from '@/lib/matchHistoryUtils';
import type { GameResponse } from '@/lib/api';

type MatchHistoryFiltersProps = Readonly<{
  games: GameResponse[];
  value: MatchHistoryFilterState;
  onChange: (next: MatchHistoryFilterState) => void;
}>;

export function MatchHistoryFilters({
  games,
  value,
  onChange,
}: MatchHistoryFiltersProps) {
  const sports = uniqueSportNames(games);
  const hasActiveFilters = hasActiveMatchHistoryFilters(value);

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-600" aria-hidden />
        <span className="text-sm font-medium text-gray-800">Filters</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(clearMatchHistoryFilterFields(value))}
            className="ml-auto inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-600">Sport</span>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={value.sport}
            onChange={(e) => onChange({ ...value, sport: e.target.value })}
          >
            <option value="">All sports</option>
            {sports.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-600">Result</span>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={value.result}
            onChange={(e) =>
              onChange({
                ...value,
                result: e.target.value as MatchHistoryFilterState['result'],
              })
            }
          >
            <option value="all">All results</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-600">From date</span>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={value.dateFrom}
            onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-600">To date</span>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={value.dateTo}
            onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
          />
        </label>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="flex flex-col gap-1.5 text-sm max-w-xs">
          <span className="text-gray-600">Sort by date</span>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={value.sortOrder}
            onChange={(e) =>
              onChange({
                ...value,
                sortOrder: e.target.value as MatchHistoryFilterState['sortOrder'],
              })
            }
            aria-label="Sort match history by date"
          >
            <option value="newest_first">Newest first</option>
            <option value="oldest_first">Oldest first</option>
          </select>
        </label>
      </div>
    </div>
  );
}
