"use client";

import { useMemo } from "react";
import type { OrderFilters as OrderFiltersType, Restaurant, Rider } from "@/types/order";

interface Props {
  restaurants: Restaurant[];
  riders: Rider[];
  filters: OrderFiltersType;
  onChange: (filters: OrderFiltersType) => void;
}

const selectClasses =
  "w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20";

const inputClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20";

function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function OrderFilters({ restaurants, riders, filters, onChange }: Props) {
  function update(partial: Partial<OrderFiltersType>) {
    onChange({ ...filters, ...partial });
  }

  const activeCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {activeCount > 0 && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              {activeCount} active
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={() => onChange({})}
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Rider</label>
          <div className="relative">
            <select
              className={selectClasses}
              value={filters.rider_id ?? ""}
              onChange={(e) => update({ rider_id: e.target.value || undefined })}
            >
              <option value="">All riders</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Restaurant</label>
          <div className="relative">
            <select
              className={selectClasses}
              value={filters.restaurant_id ?? ""}
              onChange={(e) => update({ restaurant_id: e.target.value || undefined })}
            >
              <option value="">All restaurants</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            className={inputClasses}
            value={filters.date_from ?? ""}
            onChange={(e) => update({ date_from: e.target.value || undefined })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            className={inputClasses}
            value={filters.date_to ?? ""}
            onChange={(e) => update({ date_to: e.target.value || undefined })}
          />
        </div>
      </div>
    </div>
  );
}