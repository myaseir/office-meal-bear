"use client";

import { useEffect, useMemo, useState } from "react";
import { listRestaurants, listRiders, createOrder, ApiError } from "@/lib/api-client";
import { generateIdempotencyKey } from "@/lib/idempotency";
import { getBusinessDate } from "@/lib/business-date";
import type {
  Restaurant,
  Rider,
  PaymentMethod,
  PaymentStatus,
  OrderResponse,
} from "@/types/order";

type LoadState = "loading" | "ready" | "error";

export default function OrderEntryPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string>("");

  const [restaurantId, setRestaurantId] = useState("");
  const [riderId, setRiderId] = useState("");
  const [foodAmount, setFoodAmount] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [fuel, setFuel] = useState("");
  const [riderTip, setRiderTip] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState<OrderResponse | null>(null);

  // One idempotency key per form session — regenerated only after a
  // successful submit or explicit "new order" reset, never on re-render.
  useEffect(() => {
    setIdempotencyKey(generateIdempotencyKey());
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [restaurantList, riderList] = await Promise.all([
          listRestaurants(),
          listRiders(),
        ]);
        setRestaurants(restaurantList);
        setRiders(riderList);
        setLoadState("ready");
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load data");
        setLoadState("error");
      }
    }
    load();
  }, []);

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId);
  const selectedRider = riders.find((r) => r.id === riderId);

  // Every field defaults to 0 when empty — parseFloat(x) || 0 handles
  // both "" and invalid input the same way.

  // Client-side preview only — cosmetic, not authoritative. The backend
  // recalculates all of this independently when the order is submitted.
  const preview = useMemo(() => {
    const food = parseFloat(foodAmount) || 0;
    const delivery = parseFloat(deliveryCharge) || 0;
    const adj = parseFloat(adjustment) || 0;
    const fuelVal = parseFloat(fuel) || 0;
    const riderTipVal = parseFloat(riderTip) || 0;
    const received = parseFloat(amountReceived) || 0;
    const commissionPct = selectedRestaurant?.commission_pct ?? 0;
    const isPlatformRider = selectedRider?.is_platform_rider ?? false;

    const finalDelivery = delivery + adj;
    const customerTotal = food + finalDelivery;
    const commissionAmount = food * commissionPct;
    const restaurantPayable = food - commissionAmount;
    const overchargeTip = Math.max(0, received - customerTotal);
    const effectiveTip = riderTipVal > 0 ? riderTipVal : overchargeTip;
    const amountDue = Math.max(0, customerTotal - received);
    const riderDeliveryEarning = fuelVal + 0.5 * (finalDelivery - fuelVal);
    const riderEarning = riderDeliveryEarning + effectiveTip;

    // Total revenue = everything collected on the order, tip included.
    // Mirrors the backend: total_revenue = customer_total + effective_tip.
    const totalRevenue = customerTotal + effectiveTip;

    // Platform earning (stored as meal_bear_revenue on the backend).
    // The tip is in revenue AND in the rider's earning, so it cancels out for a
    // normal rider. For the platform-owned rider nothing is paid out, so the
    // rider's earning is not subtracted.
    const platformEarning = isPlatformRider
      ? totalRevenue - restaurantPayable
      : totalRevenue - restaurantPayable - riderEarning;

    return {
      finalDelivery,
      customerTotal,
      commissionAmount,
      restaurantPayable,
      tip: overchargeTip,
      effectiveTip,
      amountDue,
      riderEarning,
      totalRevenue,
      platformEarning,
      isNegativeDelivery: finalDelivery < 0,
    };
  }, [foodAmount, deliveryCharge, adjustment, fuel, riderTip, amountReceived, selectedRestaurant, selectedRider]);

  // Only restaurant + rider are required — the backend needs valid IDs
  // for those. Every numeric field is optional and defaults to 0.
  const isFormValid =
    restaurantId !== "" && riderId !== "" && !preview.isNegativeDelivery;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const order = await createOrder({
        idempotency_key: idempotencyKey,
        order_date: getBusinessDate(),
        restaurant_id: restaurantId,
        rider_id: riderId,
        food_amount: parseFloat(foodAmount) || 0,
        delivery_charge: parseFloat(deliveryCharge) || 0,
        adjustment: parseFloat(adjustment) || 0,
        fuel: parseFloat(fuel) || 0,
        rider_tip: parseFloat(riderTip) || 0,
        amount_received: parseFloat(amountReceived) || 0,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      });
      setSubmittedOrder(order);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(
          typeof err.detail === "string" ? err.detail : "Could not create order"
        );
      } else {
        setSubmitError("Network error — check your connection and try again");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startNewOrder() {
    setSubmittedOrder(null);
    setRestaurantId("");
    setRiderId("");
    setFoodAmount("");
    setDeliveryCharge("");
    setAdjustment("");
    setFuel("");
    setRiderTip("");
    setAmountReceived("");
    setPaymentMethod("cash");
    setPaymentStatus("paid");
    setShowBreakdown(false);
    setIdempotencyKey(generateIdempotencyKey());
  }

  if (loadState === "loading") {
    return (
      <CenteredMessage>
        <div className="h-8 w-8 rounded-full border-[3px] border-[#E6E1F2] border-t-[#6D28D9] animate-spin" />
        <p className="mt-3 text-sm text-[#6B6478]">Loading order form…</p>
      </CenteredMessage>
    );
  }

  if (loadState === "error") {
    return (
      <CenteredMessage>
        <div className="h-11 w-11 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center text-lg">
          !
        </div>
        <p className="text-[#201A2E] font-semibold mt-3 text-sm">Couldn&apos;t load data</p>
        <p className="text-xs text-[#6B6478] mt-1">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg bg-[#5B21B6] text-white text-sm font-medium hover:bg-[#4C1D95] transition-colors"
        >
          Try again
        </button>
      </CenteredMessage>
    );
  }

  if (submittedOrder) {
    return <SuccessScreen order={submittedOrder} onNewOrder={startNewOrder} />;
  }

  return (
    <div className="h-dvh bg-[#FAF9FF] flex flex-col overflow-hidden">
      {/* Compact header */}
      <header className="shrink-0 border-b border-[#E6E1F2] px-4 py-2.5 flex items-center gap-2">
        <span className="h-6 w-6 rounded-md bg-[#6D28D9] flex items-center justify-center text-white text-[11px] font-semibold">
          M
        </span>
        <p className="text-sm font-semibold text-[#201A2E]">New order</p>
      </header>

      {/* Scrollable body — only scrolls if a small screen truly needs it */}
      <form
        id="order-form"
        onSubmit={handleSubmit}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3"
      >
        <div className="max-w-md mx-auto space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Restaurant">
              <SelectInput
                value={restaurantId}
                onChange={setRestaurantId}
                placeholder="Select"
                options={restaurants.map((r) => ({ value: r.id, label: r.name }))}
              />
            </Field>
            <Field label="Rider">
              <SelectInput
                value={riderId}
                onChange={setRiderId}
                placeholder="Select"
                options={riders.map((r) => ({ value: r.id, label: r.name }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Field label="Food">
              <NumberInput value={foodAmount} onChange={setFoodAmount} prefix="Rs" />
            </Field>
            <Field label="Delivery">
              <NumberInput value={deliveryCharge} onChange={setDeliveryCharge} prefix="Rs" />
            </Field>
            <Field label="Adjustment">
              <NumberInput value={adjustment} onChange={setAdjustment} allowNegative prefix="Rs" />
            </Field>
            <Field label="Fuel">
              <NumberInput value={fuel} onChange={setFuel} prefix="Rs" />
            </Field>
            <Field label="Rider tip">
              <NumberInput value={riderTip} onChange={setRiderTip} prefix="Rs" />
            </Field>
            <Field label="Received">
              <NumberInput value={amountReceived} onChange={setAmountReceived} prefix="Rs" />
            </Field>
          </div>

          {preview.isNegativeDelivery && (
            <p className="text-xs text-[#DC2626] bg-[#FEF2F2] rounded-lg px-2.5 py-2 flex items-start gap-1.5">
              <span>⚠</span>
              <span>Delivery + adjustment can&apos;t be negative.</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Payment method">
              <SegmentedControl
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { value: "cash", label: "Cash" },
                  { value: "card", label: "Card" },
                  { value: "online", label: "Online" },
                ]}
              />
            </Field>
            <Field label="Payment status">
              <SegmentedControl
                value={paymentStatus}
                onChange={setPaymentStatus}
                options={[
                  { value: "paid", label: "Paid" },
                  { value: "partial", label: "Partial" },
                  { value: "unpaid", label: "Unpaid" },
                ]}
              />
            </Field>
          </div>

          {/* Compact summary with collapsible breakdown */}
          <section className="rounded-xl border border-[#E6E1F2] bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5"
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold text-[#201A2E]">
                <span className="h-3.5 w-1 rounded-full bg-[#6D28D9]" />
                Platform earning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold text-[#5B21B6]">
                  Rs {preview.platformEarning.toFixed(2)}
                </span>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className={`h-3.5 w-3.5 text-[#8B85A0] transition-transform ${
                    showBreakdown ? "rotate-180" : ""
                  }`}
                >
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            {showBreakdown && (
              <div className="px-3 pb-2.5 pt-0.5 border-t border-[#E6E1F2] space-y-0.5">
                <PreviewRow label="Final delivery" value={preview.finalDelivery} />
                <PreviewRow label="Customer total" value={preview.customerTotal} />
                <PreviewRow label="Restaurant payable" value={preview.restaurantPayable} />
                <PreviewRow label="Overcharge tip" value={preview.tip} />
                <PreviewRow label="Effective tip" value={preview.effectiveTip} />
                <PreviewRow label="Amount due" value={preview.amountDue} />
                <PreviewRow label="Rider earning" value={preview.riderEarning} />
              </div>
            )}
          </section>

          {/* Total revenue — small, at the bottom */}
          <div className="flex items-center justify-between px-1 text-[11px] text-[#8B85A0]">
            <span>Total revenue (incl. tip)</span>
            <span className="font-medium">Rs {preview.totalRevenue.toFixed(2)}</span>
          </div>

          {submitError && (
            <p className="text-xs text-[#DC2626] bg-[#FEF2F2] rounded-lg px-2.5 py-2">
              {submitError}
            </p>
          )}
        </div>
      </form>

      {/* Submit bar — always visible, part of the layout, not floating over content */}
      <div className="shrink-0 border-t border-[#E6E1F2] bg-white px-4 py-2.5">
        <div className="max-w-md mx-auto">
          <button
            type="submit"
            form="order-form"
            disabled={!isFormValid || submitting}
            className="w-full py-2.5 rounded-xl font-medium text-white text-sm transition-all
              bg-gradient-to-r from-[#6D28D9] to-[#5B21B6]
              hover:from-[#5B21B6] hover:to-[#4C1D95]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-[#6D28D9] disabled:hover:to-[#5B21B6]
              shadow-md shadow-[#6D28D9]/20"
          >
            {submitting ? "Creating order…" : "Create order"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- layout primitives ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10.5px] font-medium text-[#6B6478] mb-1">{label}</span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  allowNegative = false,
  prefix,
}: {
  value: string;
  onChange: (v: string) => void;
  allowNegative?: boolean;
  prefix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8B85A0]">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min={allowNegative ? undefined : 0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={`w-full rounded-lg border border-[#E6E1F2] bg-[#F9F8FC] py-2 text-sm text-[#201A2E]
          outline-none transition-colors
          focus:border-[#8B5CF6] focus:bg-white focus:ring-4 focus:ring-[#8B5CF6]/10
          ${prefix ? "pl-7 pr-2" : "px-2"}`}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full appearance-none rounded-lg border border-[#E6E1F2] bg-[#F9F8FC] py-2 pl-2.5 pr-7 text-sm text-[#201A2E]
          outline-none transition-colors
          focus:border-[#8B5CF6] focus:bg-white focus:ring-4 focus:ring-[#8B5CF6]/10"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8B85A0]"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-[#F3F0FA] p-0.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-md py-2 text-[11px] font-medium transition-colors ${
              active
                ? "bg-white text-[#5B21B6] shadow-sm"
                : "text-[#6B6478] hover:text-[#201A2E]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between py-0.5 text-[12px]">
      <span className="text-[#6B6478]">{label}</span>
      <span className="text-[#201A2E] font-medium">Rs {value.toFixed(2)}</span>
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh bg-[#FAF9FF] flex flex-col items-center justify-center text-center px-6">
      {children}
    </div>
  );
}

function SuccessScreen({
  order,
  onNewOrder,
}: {
  order: OrderResponse;
  onNewOrder: () => void;
}) {
  return (
    <div className="h-dvh bg-[#FAF9FF] flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-[#EDE9FE] text-[#5B21B6] flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <h1 className="text-base font-semibold text-[#201A2E] mt-2.5">Order created</h1>
            <p className="text-xs text-[#6B6478] mt-0.5">
              {order.restaurant_name} · {order.rider_name}
            </p>
          </div>

          <section className="rounded-xl border border-[#E6E1F2] bg-white overflow-hidden">
            <div className="px-3 pt-2.5 pb-1.5 space-y-0.5">
              <PreviewRow label="Customer total" value={order.customer_total} />
              <PreviewRow label="Restaurant payable" value={order.restaurant_payable} />
              <PreviewRow label="Effective tip" value={order.effective_tip} />
              <PreviewRow label="Amount due" value={order.amount_due} />
              <PreviewRow label="Rider earning" value={order.rider_earning} />
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#F3F0FA] border-t border-[#E6E1F2]">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-[#201A2E]">
                <span className="h-3.5 w-1 rounded-full bg-[#6D28D9]" />
                Platform earning
              </span>
              <span className="text-[15px] font-bold text-[#5B21B6]">
                Rs {order.meal_bear_revenue.toFixed(2)}
              </span>
            </div>
          </section>

          {/* Total revenue — small, at the bottom */}
          <div className="flex items-center justify-between px-1 text-[11px] text-[#8B85A0]">
            <span>Total revenue (incl. tip)</span>
            <span className="font-medium">Rs {order.total_revenue.toFixed(2)}</span>
          </div>

          <button
            onClick={onNewOrder}
            className="w-full py-2.5 rounded-xl font-medium text-white text-sm transition-all
              bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] hover:from-[#5B21B6] hover:to-[#4C1D95]
              shadow-md shadow-[#6D28D9]/20"
          >
            New order
          </button>
        </div>
      </div>
    </div>
  );
}