"use client";

import { useMemo, useState } from "react";
import type { OrderResponse, RiderSummary } from "@/types/order";
import { getBusinessDate } from "@/lib/business-date";
import { startOfBusinessWeek, startOfBusinessMonth } from "@/lib/date-buckets";

interface Props {
  summaries: RiderSummary[];
  orders: OrderResponse[];
}

type Period = "all" | "daily" | "weekly" | "monthly";

interface RiderPeriodRow {
  rider_id: string;
  rider_name: string;
  is_platform_rider: boolean;   // NEW
  order_count: number;
  total_fuel: number;
  total_tip: number;
  total_earning: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function buildPeriodRows(orders: OrderResponse[], from: string): RiderPeriodRow[] {
  const byRider = new Map<string, RiderPeriodRow>();
  for (const o of orders) {
    if (o.order_date < from) continue;
    const existing = byRider.get(o.rider_id);
    if (existing) {
      existing.order_count += 1;
      existing.total_fuel += o.fuel;
      existing.total_tip += o.effective_tip;
      existing.total_earning += o.rider_earning;
    } else {
      byRider.set(o.rider_id, {
        rider_id: o.rider_id,
        rider_name: o.rider_name,
        is_platform_rider: o.is_platform_rider_snapshot,   // NEW
        order_count: 1,
        total_fuel: o.fuel,
        total_tip: o.effective_tip,
        total_earning: o.rider_earning,
      });
    }
  }
  return Array.from(byRider.values()).sort((a, b) => b.total_earning - a.total_earning);
}

const PERIOD_LABELS: Record<Period, string> = {
  all: "All time",
  daily: "Today",
  weekly: "This week",
  monthly: "This month",
};

export function RiderSummaryTable({ summaries, orders }: Props) {
  const [period, setPeriod] = useState<Period>("all");

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const periodRows = useMemo(() => {
    if (period === "all") return null;
    const today = getBusinessDate();
    const from =
      period === "daily" ? today : period === "weekly" ? startOfBusinessWeek(today) : startOfBusinessMonth(today);
    return buildPeriodRows(orders, from);
  }, [orders, period]);

  const totals = useMemo(() => {
    if (period === "all") {
      return summaries.reduce(
        (acc, r) => {
          acc.orders += r.order_count;
          acc.fuel += r.total_fuel;
          acc.tip += 0;
          acc.earning += r.total_rider_earning;
          acc.net += r.net_payable;
          return acc;
        },
        { orders: 0, fuel: 0, tip: 0, earning: 0, net: 0 }
      );
    }
    return (periodRows ?? []).reduce(
      (acc, r) => {
        acc.orders += r.order_count;
        acc.fuel += r.total_fuel;
        acc.tip += r.total_tip;
        acc.earning += r.total_earning;
        acc.net += r.total_earning; // no adjustments in period view
        return acc;
      },
      { orders: 0, fuel: 0, tip: 0, earning: 0, net: 0 }
    );
  }, [period, summaries, periodRows]);

  const PeriodTabs = (
    <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 text-xs font-medium">
      {(["all", "daily", "weekly", "monthly"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`flex-1 rounded-md py-1.5 transition-colors ${
            period === p ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );

  const isEmpty = period === "all" ? summaries.length === 0 : (periodRows ?? []).length === 0;

  if (isEmpty) {
    return (
      <div>
        {PeriodTabs}
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-900">No rider data yet</p>
          <p className="mt-1 text-xs text-gray-500">
            {period === "all"
              ? "Rider summaries will appear here once orders are recorded."
              : `No orders recorded for ${PERIOD_LABELS[period].toLowerCase()}.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {PeriodTabs}

      {period !== "all" && (
        <p className="mb-3 text-xs text-gray-400">
          Showing orders, fuel, tip and earning for this period. Adjustments and net payable reflect all-time totals only — switch to &ldquo;All time&rdquo; for those.
        </p>
      )}

      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {period === "all"
          ? summaries.map((r) => (
              <div key={r.rider_id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                      {initials(r.rider_name)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900">{r.rider_name}</p>
                      {r.is_platform_rider && <PlatformBadge />}
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {r.order_count} orders
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl bg-gray-50 p-3 text-sm">
                  <Stat label="Fuel" value={fmt(r.total_fuel)} />
                  <Stat label="Margin" value={fmt(r.total_rider_margin)} />
                  <Stat label="Earning" value={fmt(r.total_rider_earning)} />
                  <Stat label="Adjustments" value={fmt(r.total_adjustments)} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs font-medium text-gray-500">Net Payable</span>
                  <span className="text-base font-semibold tabular-nums text-purple-700">{fmt(r.net_payable)}</span>
                </div>
              </div>
            ))
          : (periodRows ?? []).map((r) => (
              <div key={r.rider_id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                      {initials(r.rider_name)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900">{r.rider_name}</p>
                      {r.is_platform_rider && <PlatformBadge />}
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {r.order_count} orders
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl bg-gray-50 p-3 text-sm">
                  <Stat label="Fuel" value={fmt(r.total_fuel)} />
                  <Stat label="Tip" value={fmt(r.total_tip)} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs font-medium text-gray-500">Earning</span>
                  <span className="text-base font-semibold tabular-nums text-purple-700">{fmt(r.total_earning)}</span>
                </div>
              </div>
            ))}

        <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">
              {period === "all" ? "Total Net Payable" : "Total Earning"}
            </span>
            <span className="text-lg font-bold tabular-nums text-purple-700">
              {fmt(period === "all" ? totals.net : totals.earning)}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">{totals.orders} orders</p>
        </div>
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-900/5 sm:block">
        <div className="max-h-[32rem] overflow-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur">
              <tr>
                <Th>Rider</Th>
                <Th align="right">Orders</Th>
                <Th align="right">Fuel</Th>
                {period === "all" ? (
                  <>
                    <Th align="right">Margin</Th>
                    <Th align="right">Earning</Th>
                    <Th align="right">Adjustments</Th>
                    <Th align="right">Net Payable</Th>
                  </>
                ) : (
                  <>
                    <Th align="right">Tip</Th>
                    <Th align="right">Earning</Th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {period === "all"
                ? summaries.map((r) => (
                    <tr key={r.rider_id} className="transition-colors hover:bg-purple-50/40">
                      <RiderCell name={r.rider_name} isPlatformRider={r.is_platform_rider} />
                      <Td align="right">{r.order_count}</Td>
                      <Td align="right">{fmt(r.total_fuel)}</Td>
                      <Td align="right">{fmt(r.total_rider_margin)}</Td>
                      <Td align="right">{fmt(r.total_rider_earning)}</Td>
                      <Td align="right">{fmt(r.total_adjustments)}</Td>
                      <Td align="right" className="font-semibold text-purple-700">{fmt(r.net_payable)}</Td>
                    </tr>
                  ))
                : (periodRows ?? []).map((r) => (
                    <tr key={r.rider_id} className="transition-colors hover:bg-purple-50/40">
                      <RiderCell name={r.rider_name} isPlatformRider={r.is_platform_rider} />
                      <Td align="right">{r.order_count}</Td>
                      <Td align="right">{fmt(r.total_fuel)}</Td>
                      <Td align="right">{fmt(r.total_tip)}</Td>
                      <Td align="right" className="font-semibold text-purple-700">{fmt(r.total_earning)}</Td>
                    </tr>
                  ))}
            </tbody>
            <tfoot className="sticky bottom-0 border-t border-gray-100 bg-gray-50/95 backdrop-blur">
              <tr>
                <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Total</td>
                <Td align="right" className="font-semibold">{totals.orders}</Td>
                <Td align="right" className="font-semibold">{fmt(totals.fuel)}</Td>
                {period === "all" ? (
                  <>
                    <Td align="right" className="font-semibold">{fmt(summaries.reduce((s, r) => s + r.total_rider_margin, 0))}</Td>
                    <Td align="right" className="font-semibold">{fmt(totals.earning)}</Td>
                    <Td align="right" className="font-semibold">{fmt(summaries.reduce((s, r) => s + r.total_adjustments, 0))}</Td>
                    <Td align="right" className="font-bold text-purple-700">{fmt(totals.net)}</Td>
                  </>
                ) : (
                  <>
                    <Td align="right" className="font-semibold">{fmt(totals.tip)}</Td>
                    <Td align="right" className="font-bold text-purple-700">{fmt(totals.earning)}</Td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 font-medium tabular-nums text-gray-900">{value}</p>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 tabular-nums text-gray-600 ${align === "right" ? "text-right" : ""} ${className}`}>
      {children}
    </td>
  );
}

function PlatformBadge() {
  return (
    <span className="rounded-full bg-gray-900 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
      Platform
    </span>
  );
}

function RiderCell({ name, isPlatformRider }: { name: string; isPlatformRider?: boolean }) {
  return (
    <td className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-semibold text-purple-700">
          {initials(name)}
        </div>
        <span className="flex items-center gap-1.5">
          <span className="font-medium text-gray-900">{name}</span>
          {isPlatformRider && <PlatformBadge />}
        </span>
      </div>
    </td>
  );
}