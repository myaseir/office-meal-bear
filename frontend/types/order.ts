export type PaymentMethod = "cash" | "card" | "online";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface Restaurant {
  id: string;
  name: string;
  commission_pct: number;
  active: boolean;
}

export interface Rider {
  id: string;
  name: string;
  active: boolean;
  is_platform_rider: boolean;   // NEW
}

export interface RiderSummary {
  rider_id: string;
  rider_name: string;
  is_platform_rider: boolean;   // NEW
  order_count: number;
  total_fuel: number;
  total_rider_margin: number;
  total_rider_earning: number;
  total_adjustments: number;
  net_payable: number;
}

export interface OrderCreateRequest {
  idempotency_key: string;
  order_date: string; // YYYY-MM-DD
  restaurant_id: string;
  rider_id: string;
  food_amount: number;
  delivery_charge: number;
  adjustment: number;
  fuel: number;
  rider_tip: number;        // NEW
  amount_received: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
}

export interface OrderUpdateRequest {
  food_amount: number;
  delivery_charge: number;
  adjustment: number;
  fuel: number;
  rider_tip: number;
  amount_received: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
}

export interface OrderFilters {
  rider_id?: string;
  restaurant_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface OrderResponse {
  id: string;
  idempotency_key: string;
  order_date: string;
  status: string;

  restaurant_id: string;
  restaurant_name: string;
  commission_pct_snapshot: number;   // NEW
  rider_id: string;
  rider_name: string;
  is_platform_rider_snapshot: boolean; // NEW

  payment_method: PaymentMethod;
  payment_status: PaymentStatus;

  food_amount: number;
  delivery_charge: number;
  adjustment: number;
  fuel: number;
  rider_tip: number;                 // NEW
  amount_received: number;

  final_delivery: number;
  customer_total: number;
  commission_amount: number;
  restaurant_payable: number;
  tip: number;
  effective_tip: number;
  amount_due: number;
  rider_earning: number;
  meal_bear_revenue: number;
  total_revenue: number;
 

  calc_version: number;
  created_at: string;
}
export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  note: string | null;
  created_at: string;
}