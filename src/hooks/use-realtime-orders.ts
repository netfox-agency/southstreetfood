"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems } from "@/types/order";
import type { OrderStatus } from "@/types/database";

const ACTIVE_STATUSES: OrderStatus[] = ["paid", "preparing", "ready"];
const ACTIVE_SET = new Set<OrderStatus>(ACTIVE_STATUSES);

// Terminal statuses that trigger loyalty points award
const LOYALTY_TERMINAL: OrderStatus[] = [
  "picked_up",
  "delivered",
  "out_for_delivery",
];

/**
 * Live board of active kitchen orders.
 *
 * Optimised for 500+ orders/day: we fetch the initial snapshot once and
 * then apply realtime INSERT / UPDATE payloads INCREMENTALLY instead of
 * refetching the whole active list (which would drag thousands of
 * order_items through the wire on every tiny status change).
 *
 * For brand-new orders we still need one extra round-trip to fetch the
 * child order_items (the realtime payload only carries the row itself).
 * That's scoped to a single inserted order — cheap.
 */
export function useRealtimeOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  // One Supabase browser client per hook instance. useMemo is safe here
  // because createClient is cheap (just wires env vars into a client).
  const supabase = useMemo(() => createClient(), []);

  const SELECT_WITH_RELATIONS = "*, order_items(*), delivery_address:delivery_addresses(*)";

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select(SELECT_WITH_RELATIONS)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false });
    // Supabase returns delivery_addresses as an array; unwrap to single object
    return ((data ?? []) as unknown[]).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      return {
        ...r,
        delivery_address: Array.isArray(r.delivery_address)
          ? r.delivery_address[0] ?? null
          : r.delivery_address ?? null,
      } as OrderWithItems;
    });
  }, [supabase]);

  const fetchOne = useCallback(
    async (orderId: string): Promise<OrderWithItems | null> => {
      const { data } = await supabase
        .from("orders")
        .select(SELECT_WITH_RELATIONS)
        .eq("id", orderId)
        .single();
      if (!data) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = data as any;
      return {
        ...r,
        delivery_address: Array.isArray(r.delivery_address)
          ? r.delivery_address[0] ?? null
          : r.delivery_address ?? null,
      } as OrderWithItems;
    },
    [supabase]
  );

  useEffect(() => {
    let cancelled = false;

    // Initial snapshot
    refetch().then((snapshot) => {
      if (cancelled) return;
      setOrders(snapshot);
      setLoading(false);
    });

    const refetchSafe = async () => {
      if (cancelled) return;
      try {
        const snap = await refetch();
        if (!cancelled) setOrders(snap);
      } catch {
        // best-effort; next poll/event will catch up
      }
    };

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          if (!row?.id || !ACTIVE_SET.has(row.status as OrderStatus)) return;
          const full = await fetchOne(row.id as string);
          if (!full || cancelled) return;
          setOrders((prev) => {
            if (prev.some((o) => o.id === full.id)) return prev;
            return [full, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          if (!row?.id) return;
          const nextStatus = row.status as OrderStatus;
          setOrders((prev) => {
            const exists = prev.some((o) => o.id === row.id);
            if (!ACTIVE_SET.has(nextStatus)) {
              return exists ? prev.filter((o) => o.id !== row.id) : prev;
            }
            if (!exists) {
              fetchOne(row.id as string).then((full) => {
                if (!full || cancelled) return;
                setOrders((curr) =>
                  curr.some((o) => o.id === full.id) ? curr : [full, ...curr]
                );
              });
              return prev;
            }
            return prev.map((o) =>
              o.id === row.id
                ? {
                    ...o,
                    ...row,
                    order_items: o.order_items,
                  }
                : o
            );
          });
        }
      )
      .subscribe((status) => {
        // Status possibles : SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED.
        // Si on tombe en erreur, on log + on refetch (le polling fallback
        // prendra le relais de toute facon, mais c'est plus reactif).
        if (process.env.NODE_ENV !== "production") {
          console.log(`[kitchen-orders] channel: ${status}`);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          refetchSafe();
        }
      });

    // Fallback polling — defense en profondeur. Si la connexion WS Realtime
    // drop silencieusement (token JWT expire au bout d'1h sur Supabase, WiFi
    // resto qui bug, etc.), on garantit que le board se met a jour au max
    // toutes les 10s. C'est largement assez pour la cuisine.
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refetchSafe();
      }
    }, 10_000);

    // Quand l'utilisateur revient sur l'onglet (alt-tab, switch app sur tablette),
    // on refetch immediatement pour rattraper les commandes ratees pendant
    // l'absence.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchSafe();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Re-sync sur reconnect reseau (e.g. WiFi resto qui re-up apres une coupure)
    const onOnline = () => refetchSafe();
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch, fetchOne]);

  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", orderId);

      if (!error) {
        setOrders((prev) =>
          prev
            .map((o) =>
              o.id === orderId ? { ...o, status: newStatus } : o
            )
            .filter((o) => ACTIVE_SET.has(o.status))
        );

        // Auto-award loyalty points when order reaches terminal status
        if (LOYALTY_TERMINAL.includes(newStatus)) {
          fetch("/api/loyalty/award", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          }).catch(() => {
            // Silent — points will be retried on next status change
          });
        }
      }
      return { error };
    },
    [supabase]
  );

  const refetchIntoState = useCallback(async () => {
    const snapshot = await refetch();
    setOrders(snapshot);
  }, [refetch]);

  return { orders, loading, updateOrderStatus, refetch: refetchIntoState };
}
