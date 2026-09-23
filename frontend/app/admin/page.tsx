"use client";

import { useEffect, useState } from "react";
import { listRestaurants, listRiders } from "@/lib/api-client";
import { RestaurantSection } from "@/components/admin/RestaurantSection";
import { RiderSection } from "@/components/admin/RiderSection";
import type { Restaurant, Rider } from "@/types/order";

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [r, ri] = await Promise.all([listRestaurants(), listRiders()]);
    setRestaurants(r);
    setRiders(ri);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-8 pb-12">
      <h1 className="text-xl font-semibold pt-2">Admin</h1>
      <RestaurantSection restaurants={restaurants} onAdded={refresh} />
      <RiderSection riders={riders} onAdded={refresh} />
    </div>
  );
}