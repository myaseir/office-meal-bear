"use client";

import { useEffect, useState, useCallback } from "react";
import { listOrders, listRestaurants, listRiders } from "@/lib/api-client";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import type {
  OrderResponse,
  OrderFilters as OrderFiltersType,
  Restaurant,
  Rider,
} from "@/types/order";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [filters, setFilters] = useState<OrderFiltersType>({});
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<OrderResponse | null>(null);

  const refresh = useCallback(async (currentFilters: OrderFiltersType) => {
    setLoading(true);
    const data = await listOrders(currentFilters);
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function loadLookups() {
      const [r, ri] = await Promise.all([listRestaurants(), listRiders()]);
      setRestaurants(r);
      setRiders(ri);
    }
    loadLookups();
  }, []);

  useEffect(() => {
    refresh(filters);
  }, [filters, refresh]);

  return (
    <div className="p-4 space-y-6 pb-12">
      <h1 className="text-xl font-semibold pt-2">Orders</h1>

      <OrderFilters
        restaurants={restaurants}
        riders={riders}
        filters={filters}
        onChange={setFilters}
      />

      {loading ? (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      ) : (
        <OrdersTable orders={orders} onEdit={setEditingOrder} />
      )}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={() => {
            setEditingOrder(null);
            refresh(filters);
          }}
        />
      )}
    </div>
  );
}