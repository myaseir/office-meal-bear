"use client";

import { useEffect, useState } from "react";
import { getRiderSummaries, createRiderAdjustment, ApiError } from "@/lib/api-client";
import type { RiderSummary } from "@/types/order";

export default function RidersPage() {
  const [summaries, setSummaries] = useState<RiderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRiderId, setActiveRiderId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setSummaries(await getRiderSummaries());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRiderId || amount === "" || !reason.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await createRiderAdjustment({
        rider_id: activeRiderId,
        amount: parseFloat(amount),
        reason: reason.trim(),
        adjustment_date: new Date().toISOString().slice(0, 10),
      });
      setAmount("");
      setReason("");
      setActiveRiderId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 space-y-4 pb-12">
      <h1 className="text-xl font-semibold pt-2">Riders</h1>

      {summaries.map((s) => (
        <div key={s.rider_id} className="rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium">{s.rider_name}</span>
            <span className="text-gray-500">{s.order_count} orders</span>
          </div>
          <Row label="Total fuel" value={s.total_fuel} />
          <Row label="Total margin" value={s.total_rider_margin} />
          <Row label="Total earning" value={s.total_rider_earning} />
          <Row label="Adjustments" value={s.total_adjustments} />
          <div className="border-t border-gray-100 pt-2">
            <Row label="Net payable" value={s.net_payable} bold />
          </div>

          {activeRiderId === s.rider_id ? (
            <form onSubmit={handleAdjustment} className="space-y-2 pt-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Amount (use - to deduct)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
                autoFocus
              />
              <input
                type="text"
                placeholder="Reason (e.g. Emergency advance)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
              />
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRiderId(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setActiveRiderId(s.rider_id)}
              className="w-full mt-1 py-2 rounded-lg border border-gray-300 text-sm font-medium"
            >
              Add / deduct
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : "text-gray-600"}`}>
      <span>{label}</span>
      <span>Rs {value.toFixed(2)}</span>
    </div>
  );
}