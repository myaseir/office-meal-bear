"use client";

import { useMemo, useState } from "react";
import type { OrderResponse } from "@/types/order";

interface Props {
  orders: OrderResponse[];
}

interface RestaurantTotal {
  restaurant_id: string;
  restaurant_name: string;
  order_count: number;
  food_total: number;
  commission_total: number;
  payable: number;
}

export function RestaurantPayableSection({ orders }: Props) {
  const [search, setSearch] = useState("");

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const byRestaurant = useMemo(() => {
    const map = new Map<string, RestaurantTotal>();
    for (const o of orders) {
      const existing = map.get(o.restaurant_id);
      if (existing) {
        existing.order_count += 1;
        existing.food_total += o.food_amount;
        existing.commission_total += o.commission_amount;
        existing.payable += o.restaurant_payable;
      } else {
        map.set(o.restaurant_id, {
          restaurant_id: o.restaurant_id,
          restaurant_name: o.restaurant_name,
          order_count: 1,
          food_total: o.food_amount,
          commission_total: o.commission_amount,
          payable: o.restaurant_payable,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.payable - a.payable);
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return byRestaurant;
    const q = search.trim().toLowerCase();
    return byRestaurant.filter((r) => r.restaurant_name.toLowerCase().includes(q));
  }, [byRestaurant, search]);

  const grandTotal = useMemo(
    () => filtered.reduce((sum, r) => sum + r.payable, 0),
    [filtered]
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Restaurant Payable</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} {filtered.length === 1 ? "restaurant" : "restaurants"}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search restaurant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* Grand total banner */}
      <div className="flex items-center justify-between bg-purple-50 px-5 py-3">
        <span className="text-sm font-semibold text-purple-700">
          Total payable{search.trim() ? " (filtered)" : ""}
        </span>
        <span className="text-lg font-bold tabular-nums text-purple-700">{fmt(grandTotal)}</span>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 p-4 sm:hidden">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No matching restaurants</p>
        )}
        {filtered.map((r) => (
          <div key={r.restaurant_id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{r.restaurant_name}</p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {r.order_count} orders
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-400">Food</p>
                <p className="font-medium text-gray-900">{fmt(r.food_total)}</p>
              </div>
              <div>
                <p className="text-gray-400">Commission</p>
                <p className="font-medium text-gray-900">{fmt(r.commission_total)}</p>
              </div>
              <div>
                <p className="text-gray-400">Payable</p>
                <p className="font-semibold text-purple-700">{fmt(r.payable)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Restaurant</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Orders</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Food Total</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Commission</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                  No matching restaurants
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.restaurant_id} className="hover:bg-purple-50/40 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{r.restaurant_name}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{r.order_count}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{fmt(r.food_total)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{fmt(r.commission_total)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-purple-700">{fmt(r.payable)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}