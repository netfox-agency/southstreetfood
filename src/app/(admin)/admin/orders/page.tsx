"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingBag,
  Search,
  Download,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Phone,
} from "lucide-react";

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  order_type: string;
  total: number;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payee",
  accepted: "Acceptee",
  preparing: "En prep",
  ready: "Prete",
  out_for_delivery: "En livraison",
  delivered: "Livree",
  picked_up: "Recuperee",
  completed: "Terminee",
  cancelled: "Annulee",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-50 text-orange-600",
  paid: "bg-blue-50 text-blue-600",
  accepted: "bg-blue-50 text-blue-600",
  preparing: "bg-amber-50 text-amber-600",
  ready: "bg-emerald-50 text-emerald-600",
  out_for_delivery: "bg-purple-50 text-purple-600",
  delivered: "bg-[#f5f5f7] text-[#86868b]",
  picked_up: "bg-[#f5f5f7] text-[#86868b]",
  completed: "bg-[#f5f5f7] text-[#86868b]",
  cancelled: "bg-red-50 text-red-500",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const admin = createClient();
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;

      const { data } = await (admin as any)
        .from("orders")
        .select("*")
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay)
        .order("created_at", { ascending: false });

      setOrders(data || []);
    } catch {
      // Use empty list on error
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const changeDate = (offset: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split("T")[0]);
  };

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.customer_name?.toLowerCase().includes(s) ||
      o.customer_phone?.includes(s) ||
      String(o.order_number).includes(s)
    );
  });

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)} \u20ac`;
  const isToday = date === new Date().toISOString().split("T")[0];
  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const totalRevenue = orders
    .filter((o) => !["cancelled"].includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Commandes</h1>
          <p className="text-[#86868b] text-sm mt-0.5">
            {orders.length} commande{orders.length > 1 ? "s" : ""} &middot; {formatPrice(totalRevenue)} CA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="h-9 w-9 rounded-lg border border-[#e5e5ea] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-[#86868b] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => changeDate(-1)} className="h-9 w-9 rounded-lg border border-[#e5e5ea] flex items-center justify-center hover:bg-[#f5f5f7] cursor-pointer">
          <ChevronLeft className="h-4 w-4 text-[#86868b]" />
        </button>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#86868b]" />
          <span className="text-[15px] font-semibold text-[#1d1d1f] capitalize">{dateLabel}</span>
          {isToday && (
            <span className="text-[11px] font-medium bg-[#1d1d1f] text-white px-2 py-0.5 rounded-full">Aujourd&apos;hui</span>
          )}
        </div>
        <button onClick={() => changeDate(1)} className="h-9 w-9 rounded-lg border border-[#e5e5ea] flex items-center justify-center hover:bg-[#f5f5f7] cursor-pointer">
          <ChevronRight className="h-4 w-4 text-[#86868b]" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#aeaeb2]" />
        <input
          type="text"
          placeholder="Rechercher par nom, numero ou telephone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all"
        />
      </div>

      {/* Orders list — Uber Eats style */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#f5f5f7] animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-10 w-10 text-[#d1d1d6] mx-auto mb-3" />
          <p className="text-[#86868b] text-[15px]">Aucune commande</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
          <div className="divide-y divide-[#f0f0f2]">
            {filteredOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafafa] transition-colors">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-[#f5f5f7] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#1d1d1f]">
                    {(order.customer_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] text-[#1d1d1f] truncate">
                      {order.customer_name || "Client"}
                    </span>
                    <span className="text-[#aeaeb2] text-xs">#{order.order_number}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#86868b] mt-0.5">
                    <span>{order.order_type === "delivery" ? "Livraison" : order.order_type === "collect" ? "A emporter" : "Sur place"}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <span className="font-bold text-[15px] text-[#1d1d1f] tabular-nums">
                  {formatPrice(order.total || 0)}
                </span>

                {/* Status */}
                <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
