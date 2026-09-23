"use client";

import { useMemo, useState } from "react";
import { createExpense, updateExpense, deleteExpense, ApiError } from "@/lib/api-client";
import { getBusinessDate } from "@/lib/business-date";
import type { Expense, OrderResponse } from "@/types/order";

interface Props {
  expenses: Expense[];
  orders: OrderResponse[];
  onChanged: () => void;
}

const CATEGORIES = ["rent", "utilities", "fuel", "salary", "maintenance", "misc"];

export function ExpenseSection({ expenses, orders, onChanged }: Props) {
  const [expenseDate, setExpenseDate] = useState(getBusinessDate());
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Profit for whatever date is currently selected in the form —
  // this is what updates live as you type, so you see the effect
  // of the expense you're about to add before you submit it.
  const dayProfit = useMemo(() => {
    const dayRevenue = orders
      .filter((o) => o.order_date === expenseDate)
      .reduce((sum, o) => sum + o.meal_bear_revenue, 0);
    const existingExpenses = expenses
      .filter((e) => e.expense_date === expenseDate)
      .reduce((sum, e) => sum + e.amount, 0);
    const pendingAmount = editingId ? 0 : parseFloat(amount) || 0;
    return {
      revenue: dayRevenue,
      expenses: existingExpenses + pendingAmount,
      profit: dayRevenue - existingExpenses - pendingAmount,
    };
  }, [orders, expenses, expenseDate, amount, editingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (editingId) {
        await updateExpense(editingId, { category, amount: amt, note: note.trim() || undefined });
      } else {
        await createExpense({
          expense_date: expenseDate,
          category,
          amount: amt,
          note: note.trim() || undefined,
        });
      }
      resetForm();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setAmount("");
    setNote("");
    setCategory(CATEGORIES[0]);
    setEditingId(null);
  }

  function startEdit(exp: Expense) {
    setEditingId(exp.id);
    setExpenseDate(exp.expense_date);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setNote(exp.note ?? "");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Failed to delete expense");
    }
  }

  // Group expenses by date, newest first
  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const list = map.get(e.expense_date) ?? [];
      list.push(e);
      map.set(e.expense_date, list);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expenses]);

  function profitForDate(date: string) {
    const revenue = orders
      .filter((o) => o.order_date === date)
      .reduce((sum, o) => sum + o.meal_bear_revenue, 0);
    const spent = (grouped.find(([d]) => d === date)?.[1] ?? []).reduce((sum, e) => sum + e.amount, 0);
    return { revenue, spent, profit: revenue - spent };
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Expenses</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track daily costs and see real profit</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 border-b border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              disabled={!!editingId}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. gas bill"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Live profit preview for the selected date */}
        <div className="flex items-center justify-between rounded-lg bg-purple-50 px-3 py-2 text-xs">
          <span className="text-purple-700 font-medium">
            Profit for {expenseDate}
          </span>
          <span className="flex gap-3 tabular-nums">
            <span className="text-gray-500">Rev {fmt(dayProfit.revenue)}</span>
            <span className="text-gray-500">− Exp {fmt(dayProfit.expenses)}</span>
            <span className="font-semibold text-purple-700">= {fmt(dayProfit.profit)}</span>
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-40"
          >
            {submitting ? "Saving..." : editingId ? "Update expense" : "Add expense"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>

      {/* Grouped list */}
      <div className="divide-y divide-gray-100">
        {grouped.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No expenses recorded</p>
          </div>
        )}
        {grouped.map(([date, dayExpenses]) => {
          const { revenue, spent, profit } = profitForDate(date);
          return (
            <div key={date} className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">{date}</span>
                <span className="flex gap-3 text-xs tabular-nums">
                  <span className="text-gray-400">Rev {fmt(revenue)}</span>
                  <span className="text-gray-400">Exp {fmt(spent)}</span>
                  <span className={`font-semibold ${profit >= 0 ? "text-purple-700" : "text-red-600"}`}>
                    Profit {fmt(profit)}
                  </span>
                </span>
              </div>
              <ul className="space-y-1">
                {dayExpenses.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                    <span className="capitalize">
                      {e.category}
                      {e.note && <span className="text-gray-400"> · {e.note}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums font-medium text-gray-900">{fmt(e.amount)}</span>
                      <button onClick={() => startEdit(e)} className="text-purple-600 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:underline">
                        Delete
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}