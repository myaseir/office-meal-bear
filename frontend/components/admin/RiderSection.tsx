"use client";

import { useState } from "react";
import { createRider, updateRider, ApiError } from "@/lib/api-client";
import type { Rider } from "@/types/order";

export function RiderSection({
  riders,
  onAdded,
}: {
  riders: Rider[];
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [isPlatformRider, setIsPlatformRider] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await createRider({ name: name.trim(), is_platform_rider: isPlatformRider });
      setName("");
      setIsPlatformRider(false);
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Failed to add rider");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePlatform(rider: Rider) {
    setTogglingId(rider.id);
    setError("");
    try {
      await updateRider(rider.id, { is_platform_rider: !rider.is_platform_rider });
      onAdded(); // reuse the same refresh callback used after adding
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Failed to update rider");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Riders</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {riders.length} {riders.length === 1 ? "rider" : "riders"} registered
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
              d="M5 20a7 7 0 0114 0M12 12a4 4 0 100-8 4 4 0 000 8z"
            />
          </svg>
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 border-b border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <div>
            <label htmlFor="rider-name" className="block text-xs font-medium text-gray-600 mb-1">
              Rider name
            </label>
            <input
              id="rider-name"
              type="text"
              name="rider-name"
              autoComplete="off"
              placeholder="e.g. Daniyal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
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

        <label className="flex items-center gap-2 text-xs text-gray-600 select-none">
          <input
            type="checkbox"
            checked={isPlatformRider}
            onChange={(e) => setIsPlatformRider(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          Platform-owned rider (e.g. Self-delivery) — earnings count as platform profit, nothing payable
        </label>

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
        {riders.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-gray-50/60 transition-colors">
            <span className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{r.name}</span>
              {r.is_platform_rider && (
                <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                  Platform
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => handleTogglePlatform(r)}
              disabled={togglingId === r.id}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
            >
              {togglingId === r.id
                ? "Saving..."
                : r.is_platform_rider
                ? "Unmark platform"
                : "Mark as platform"}
            </button>
          </li>
        ))}
        {riders.length === 0 && (
          <li className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No riders yet</p>
            <p className="text-xs text-gray-300 mt-0.5">Add your first one above</p>
          </li>
        )}
      </ul>
    </section>
  );
}