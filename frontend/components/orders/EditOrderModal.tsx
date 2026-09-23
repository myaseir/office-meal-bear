"use client";

import { useState } from "react";
import { updateOrder, ApiError } from "@/lib/api-client";
import type { OrderResponse, PaymentMethod, PaymentStatus } from "@/types/order";

interface Props {
  order: OrderResponse;
  onClose: () => void;
  onSaved: () => void;
}

const selectClasses =
  "w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20";

const inputClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20";

export function EditOrderModal({ order, onClose, onSaved }: Props) {
  const [foodAmount, setFoodAmount] = useState(order.food_amount);
  const [deliveryCharge, setDeliveryCharge] = useState(order.delivery_charge);
  const [adjustment, setAdjustment] = useState(order.adjustment);
  const [fuel, setFuel] = useState(order.fuel);
  const [riderTip, setRiderTip] = useState(order.rider_tip);
  const [amountReceived, setAmountReceived] = useState(order.amount_received);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.payment_method);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.payment_status);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateOrder(order.id, {
        food_amount: foodAmount,
        delivery_charge: deliveryCharge,
        adjustment,
        fuel,
        rider_tip: riderTip,
        amount_received: amountReceived,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Failed to update order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">Edit Order</h2>
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {order.restaurant_name} · {order.rider_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Amounts
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Food Amount" value={foodAmount} onChange={setFoodAmount} />
                <Field label="Delivery Charge" value={deliveryCharge} onChange={setDeliveryCharge} />
                <Field label="Adjustment" value={adjustment} onChange={setAdjustment} />
                <Field label="Fuel" value={fuel} onChange={setFuel} />
                <Field label="Rider Tip" value={riderTip} onChange={setRiderTip} />
                <Field label="Amount Received" value={amountReceived} onChange={setAmountReceived} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Payment
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Method</label>
                  <div className="relative">
                    <select
                      className={selectClasses}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Status</label>
                  <div className="relative">
                    <select
                      className={selectClasses}
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    >
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div
            className="flex gap-2 border-t border-gray-100 px-5 py-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #9333ea, #7e22ce)" }}
            >
              {submitting && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-500">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          className={inputClasses}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}