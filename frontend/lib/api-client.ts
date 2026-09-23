import type {
  OrderCreateRequest,
  OrderResponse,
  OrderUpdateRequest,
  OrderFilters,
  Restaurant,
  Rider,
  RiderSummary,
  Expense,
} from "@/types/order";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let detail: unknown;
    try {
      const body = await res.json();
      detail = body.detail ?? body;
    } catch {
      detail = res.statusText;
    }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<T>;
}

export function listRestaurants(): Promise<Restaurant[]> {
  return request<Restaurant[]>("/restaurants");
}

export function createRestaurant(payload: {
  name: string;
  commission_pct: number;
}): Promise<Restaurant> {
  return request<Restaurant>("/restaurants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listRiders(): Promise<Rider[]> {
  return request<Rider[]>("/riders");
}

export function createRider(payload: {
  name: string;
  is_platform_rider?: boolean;
}): Promise<Rider> {
  return request<Rider>("/riders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRider(
  riderId: string,
  payload: { name?: string; active?: boolean; is_platform_rider?: boolean }
): Promise<Rider> {
  return request<Rider>(`/riders/${riderId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getRiderSummaries(): Promise<RiderSummary[]> {
  return request<RiderSummary[]>("/riders/summary");
}

export function createRiderAdjustment(payload: {
  rider_id: string;
  amount: number;
  reason: string;
  adjustment_date: string;
}): Promise<unknown> {
  return request("/riders/adjustments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createOrder(payload: OrderCreateRequest): Promise<OrderResponse> {
  return request<OrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listOrders(filters: OrderFilters = {}): Promise<OrderResponse[]> {
  const params = new URLSearchParams();
  if (filters.rider_id) params.set("rider_id", filters.rider_id);
  if (filters.restaurant_id) params.set("restaurant_id", filters.restaurant_id);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);

  const qs = params.toString();
  return request<OrderResponse[]>(`/orders${qs ? `?${qs}` : ""}`);
}

export function updateOrder(
  orderId: string,
  payload: OrderUpdateRequest
): Promise<OrderResponse> {
  return request<OrderResponse>(`/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createExpense(payload: {
  expense_date: string;
  category: string;
  amount: number;
  note?: string;
}): Promise<Expense> {
  return request<Expense>("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listExpenses(filters: { date_from?: string; date_to?: string } = {}): Promise<Expense[]> {
  const params = new URLSearchParams();
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  const qs = params.toString();
  return request<Expense[]>(`/expenses${qs ? `?${qs}` : ""}`);
}

export function updateExpense(
  expenseId: string,
  payload: { category: string; amount: number; note?: string }
): Promise<Expense> {
  return request<Expense>(`/expenses/${expenseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(expenseId: string): Promise<void> {
  return request<void>(`/expenses/${expenseId}`, { method: "DELETE" });
}