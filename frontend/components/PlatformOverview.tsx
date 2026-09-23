"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Percent,
  TrendingUp,
  Bike,
  Store,
  AlertCircle,
  CalendarDays,
  Receipt,
} from "lucide-react";
import type { OrderResponse, Expense } from "@/types/order";
import { getBusinessDate } from "@/lib/business-date";

interface Props {
  orders: OrderResponse[];
  expenses: Expense[];
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: "default" | "accent" | "warning";
}

type Tone = NonNullable<StatCardProps["tone"]>;

const toneStyles: Record<Tone, { bg: string; icon: string; value: string }> = {
  default: { bg: "bg-gray-50", icon: "text-gray-500", value: "text-gray-900" },
  accent: { bg: "bg-purple-50", icon: "text-purple-600", value: "text-purple-700" },
  warning: { bg: "bg-amber-50", icon: "text-amber-600", value: "text-amber-700" },
};

function StatCard({ label, value, icon: Icon, tone = "default" }: StatCardProps) {
  const styles = toneStyles[tone];
  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles.bg}`}>
        <Icon className={`h-5 w-5 ${styles.icon}`} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className={`mt-1 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${styles.value}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// --- date bucketing helpers ---
// order_date / expense_date are already correct "business date" strings
// (YYYY-MM-DD) thanks to the getBusinessDate() fix on the order entry form.

function startOfBusinessWeek(businessDate: string): string {
  const d = new Date(businessDate + "T00:00:00");
  const day = d.getDay(); // 0 = Sun
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
}

function startOfBusinessMonth(businessDate: string): string {
  return businessDate.slice(0, 7) + "-01";
}

interface PeriodTotals {
  revenue: number;
  grossProfit: number;
  expenses: number;
  profit: number;
  orderCount: number;
}

function sumPeriod(orders: OrderResponse[], expenses: Expense[], from: string): PeriodTotals {
  const orderTotals = orders
    .filter((o) => o.order_date >= from)
    .reduce(
      (acc, o) => {
        acc.revenue += o.customer_total;
        acc.grossProfit += o.meal_bear_revenue;
        acc.orderCount += 1;
        return acc;
      },
      { revenue: 0, grossProfit: 0, orderCount: 0 }
    );

  const expenseTotal = expenses
    .filter((e) => e.expense_date >= from)
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    revenue: orderTotals.revenue,
    grossProfit: orderTotals.grossProfit,
    expenses: expenseTotal,
    profit: orderTotals.grossProfit - expenseTotal,
    orderCount: orderTotals.orderCount,
  };
}

function PeriodCard({
  label,
  totals,
  fmt,
}: {
  label: string;
  totals: PeriodTotals;
  fmt: (n: number) => string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
          {totals.orderCount} orders
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <p className="text-[11px] text-gray-400">Revenue</p>
          <p className="text-sm font-semibold tabular-nums text-gray-900">{fmt(totals.revenue)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">Expenses</p>
          <p className="text-sm font-semibold tabular-nums text-red-500">{fmt(totals.expenses)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400">Profit</p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              totals.profit >= 0 ? "text-purple-700" : "text-red-600"
            }`}
          >
            {fmt(totals.profit)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PlatformOverview({ orders, expenses }: Props) {
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totals = useMemo(() => {
    const orderTotals = orders.reduce(
      (acc, o) => {
        acc.revenue += o.customer_total;
        acc.commission += o.commission_amount;
        acc.grossProfit += o.meal_bear_revenue;
        acc.riderPayout += o.rider_earning;
        acc.restaurantPayable += o.restaurant_payable;
        acc.due += o.amount_due;
        return acc;
      },
      { revenue: 0, commission: 0, grossProfit: 0, riderPayout: 0, restaurantPayable: 0, due: 0 }
    );
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      ...orderTotals,
      totalExpenses,
      netProfit: orderTotals.grossProfit - totalExpenses,
    };
  }, [orders, expenses]);

  const periodTotals = useMemo(() => {
    const today = getBusinessDate();
    const weekStart = startOfBusinessWeek(today);
    const monthStart = startOfBusinessMonth(today);
    return {
      daily: sumPeriod(orders, expenses, today),
      weekly: sumPeriod(orders, expenses, weekStart),
      monthly: sumPeriod(orders, expenses, monthStart),
    };
  }, [orders, expenses]);

  const cards: StatCardProps[] = [
    { label: "Total Revenue", value: fmt(totals.revenue), icon: DollarSign },
    { label: "Commission", value: fmt(totals.commission), icon: Percent },
    { label: "Total Expenses", value: fmt(totals.totalExpenses), icon: Receipt, tone: "warning" },
    { label: "Net Profit", value: fmt(totals.netProfit), icon: TrendingUp, tone: "accent" },
    { label: "Rider Payouts", value: fmt(totals.riderPayout), icon: Bike },
    { label: "Restaurant Payable", value: fmt(totals.restaurantPayable), icon: Store },
    {
      label: "Amount Due",
      value: fmt(totals.due),
      icon: AlertCircle,
      tone: totals.due > 0 ? "warning" : "default",
    },
  ];

  return (
    <div className="space-y-5">
      <div
        className="grid gap-3 sm:gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
      >
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Revenue, expenses &amp; profit by period
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PeriodCard label="Today" totals={periodTotals.daily} fmt={fmt} />
          <PeriodCard label="This week" totals={periodTotals.weekly} fmt={fmt} />
          <PeriodCard label="This month" totals={periodTotals.monthly} fmt={fmt} />
        </div>
      </div>
    </div>
  );
}