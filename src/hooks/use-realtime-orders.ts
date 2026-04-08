"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems } from "@/types/order";
import type { OrderStatus } from "@/types/database";

const ACTIVE_STATUSES: OrderStatus[] = [
  "paid",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
];

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data as OrderWithItems[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    const supabase = createClient();
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        () => {
          // Refetch to get full order with items
          fetchOrders();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() } as never)
        .eq("id", orderId);

      if (!error) {
        setOrders((prev) =>
          prev
            .map((o) =>
              o.id === orderId ? { ...o, status: newStatus } : o
            )
            .filter((o) => ACTIVE_STATUSES.includes(o.status))
        );
      }
      return { error };
    },
    []
  );

  return { orders, loading, updateOrderStatus, refetch: fetchOrders };
}
