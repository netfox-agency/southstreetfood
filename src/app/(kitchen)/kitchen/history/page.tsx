"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Package, Truck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { OrderWithItems } from "@/types/order";

export default function KitchenHistory() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .in("status", ["picked_up", "delivered", "out_for_delivery"])
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      setOrders((data as OrderWithItems[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const avgTime = orders.length > 0
    ? Math.round(
        orders
          .filter((o) => o.estimated_ready_at)
          .reduce((s, o) => {
            const created = new Date(o.created_at).getTime();
            const ready = new Date(o.updated_at).getTime();
            return s + (ready - created) / 60000;
          }, 0) / Math.max(orders.filter((o) => o.estimated_ready_at).length, 1)
      )
    : 0;

  return (
    <div className="h-dvh flex flex-col bg-[#0a0a12]">
      <header className="shrink-0 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/kitchen"
            className="text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-white">
            Historique du jour
          </h1>
        </div>
      </header>

      {/* Stats */}
      <div className="shrink-0 px-4 py-4 grid grid-cols-3 gap-4">
        {[
          { label: "Commandes", value: String(orders.length), color: "text-white" },
          { label: "Chiffre", value: formatPrice(totalRevenue), color: "text-emerald-400" },
          { label: "Temps moyen", value: `${avgTime} min`, color: "text-amber-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center"
          >
            <div className={cn("text-2xl font-black tabular-nums", s.color)}>
              {s.value}
            </div>
            <div className="text-[10px] text-white/25 uppercase tracking-wider mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading && (
          <p className="text-white/20 text-center py-10">Chargement...</p>
        )}
        {!loading && orders.length === 0 && (
          <p className="text-white/20 text-center py-10">
            Aucune commande completee aujourd&apos;hui
          </p>
        )}
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-white font-bold tabular-nums">
                #{String(order.order_number).padStart(4, "0")}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  order.order_type === "delivery"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-emerald-500/20 text-emerald-400"
                )}
              >
                {order.order_type === "delivery" ? "LIV" : "COL"}
              </span>
              <span className="text-white/30 text-sm">
                {order.customer_name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/50 text-sm tabular-nums">
                {formatTime(order.created_at)}
              </span>
              <span className="text-white font-semibold text-sm tabular-nums">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
