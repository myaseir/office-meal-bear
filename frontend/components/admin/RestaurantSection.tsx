"use client";

import { useState } from "react";
import { createRestaurant, ApiError } from "@/lib/api-client";
import type { Restaurant } from "@/types/order";

export function RestaurantSection({
  restaurants,
  onAdded,
}: {
  restaurants: Restaurant[];
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [commissionPct, setCommissionPct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || commissionPct === "") return;

    setSubmitting(true);
    setError("");
    try {
      await createRestaurant({
        name: name.trim(),
        commission_pct: parseFloat(commissionPct) / 100,
      });
      setName("");
      setCommissionPct("");
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Failed to add restaurant");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Restaurants</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"} registered
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900/5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-4.5 w-4.5 text-gray-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3v18M3 8h4M7 3v10M11 3v18M15 3v6a3 3 0 003 3v9"
            />
          </svg>
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 border-b border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3">
          <div>
            <label htmlFor="restaurant-name" className="block text-xs font-medium text-gray-600 mb-1">
              Restaurant name
            </label>
            <input
              id="restaurant-name"
              type="text"
              name="restaurant-name"
              autoComplete="off"
              placeholder="e.g. Yak & Bull"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="commission-pct" className="block text-xs font-medium text-gray-600 mb-1">
              Commission %
            </label>
            <input
              id="commission-pct"
              type="number"
              name="commission-pct"
              autoComplete="off"
              inputMode="decimal"
              placeholder="15"
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              min={0}
              max={100}
              step="any"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Adding
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v5M12 16h.01" />
            </svg>
            {error}
          </p>
        )}
      </form>

      {/* List */}
      <ul className="divide-y divide-gray-100">
        {restaurants.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-gray-50/60 transition-colors">
            <span className="font-medium text-gray-900">{r.name}</span>
            <span className="inline-flex items-center rounded-full bg-gray-900/5 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {(r.commission_pct * 100).toFixed(0)}% commission
            </span>
          </li>
        ))}
        {restaurants.length === 0 && (
          <li className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No restaurants yet</p>
            <p className="text-xs text-gray-300 mt-0.5">Add your first one above</p>
          </li>
        )}
      </ul>
    </section>
  );
}