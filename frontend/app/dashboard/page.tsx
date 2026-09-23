"use client";

import { useEffect, useState } from "react";
import { listOrders, getRiderSummaries, listExpenses, ApiError } from "@/lib/api-client";
import type { OrderResponse, RiderSummary, Expense } from "@/types/order";
import { PlatformOverview } from "@/components/PlatformOverview";
import { RiderSummaryTable } from "@/components/RiderSummaryTable";
import { RestaurantPayableSection } from "@/components/RestaurantPayableSection";
import { ExpenseSection } from "@/components/ExpenseSection";

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [summaries, setSummaries] = useState<RiderSummary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [ordersData, summariesData, expensesData] = await Promise.all([
        listOrders(),
        getRiderSummaries(),
        listExpenses(),
      ]);
      setOrders(ordersData);
      setSummaries(summariesData);
      setExpenses(expensesData);
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <PlatformOverview orders={orders} expenses={expenses} />
      <ExpenseSection expenses={expenses} orders={orders} onChanged={load} />
      <RestaurantPayableSection orders={orders} />
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Rider Summary</h2>
        <RiderSummaryTable summaries={summaries} orders={orders} />
      </div>
    </div>
  );
}