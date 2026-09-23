"use client";

import type { OrderResponse } from "@/types/order";

interface Props {
  orders: OrderResponse[];
  onEdit: (order: OrderResponse) => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    failed: "bg-red-50 text-red-700 ring-red-600/20",
  };
  const style = styles[status.toLowerCase()] ?? "bg-purple-50 text-purple-700 ring-purple-600/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}

export function OrdersTable({ orders, onEdit }: Props) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-12 text-center">
        <svg
          className="h-10 w-10 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="font-medium text-gray-700">No orders found</p>
        <p className="text-sm text-gray-400">Orders will appear here once created.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="space-y-3 sm:hidden">
        {orders.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{o.restaurant_name}</p>
                <p className="text-xs text-gray-500">{o.order_date} · {o.rider_name}</p>
              </div>
              <StatusBadge status={o.payment_status} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Total</p>
                <p className="text-sm font-semibold text-gray-900">{o.customer_total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Tip</p>
                <p className="text-sm font-semibold text-gray-900">{o.effective_tip.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Earning</p>
                <p className="text-sm font-semibold text-gray-900">{o.rider_earning.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm">
                {o.amount_due > 0 ? (
                  <span className="font-medium text-red-600">Due: {o.amount_due.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-400">Settled</span>
                )}
              </span>
              <button
                onClick={() => onEdit(o)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50 active:bg-purple-100"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Restaurant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Rider</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Food</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Delivery</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Tip</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Earning</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Due</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Payment</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-purple-50/40">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">{o.order_date}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{o.restaurant_name}</td>
                <td className="px-4 py-3 text-gray-600">{o.rider_name}</td>
                <td className="px-4 py-3 text-right text-gray-600">{o.food_amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{o.final_delivery.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {o.customer_total.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{o.effective_tip.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{o.rider_earning.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  {o.amount_due > 0 ? (
                    <span className="font-semibold text-red-600">{o.amount_due.toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-400">0.00</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.payment_status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(o)}
                    className="rounded-lg px-3 py-1.5 font-medium text-purple-700 transition-colors hover:bg-purple-100"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}