"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Truck,
  Store,
  MapPin,
  Ban,
  Receipt,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintTicketButton } from "@/components/print-ticket-button";

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  total: number;
  subtotal: number;
  delivery_fee: number;
  status: string;
  order_type: string;
  created_at: string;
  notes: string | null;
};

type Stats = {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalDeliveryFees: number;
  avgOrderValue: number;
  byType: { dine_in?: number; collect: number; delivery: number };
};

const formatPrice = (cents: number) =>
  `${(cents / 100).toFixed(2).replace(".", ",")} €`;

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const typeLabels: Record<string, { label: string; icon: typeof Store }> = {
  collect: { label: "A emporter", icon: MapPin },
  delivery: { label: "Livraison", icon: Truck },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  paid: { label: "Payee", color: "bg-blue-50 text-blue-700" },
  preparing: { label: "En cours", color: "bg-amber-50 text-amber-700" },
  ready: { label: "Prete", color: "bg-emerald-50 text-emerald-700" },
  out_for_delivery: { label: "En livraison", color: "bg-purple-50 text-purple-700" },
  delivered: { label: "Livree", color: "bg-emerald-50 text-emerald-700" },
  picked_up: { label: "Recuperee", color: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Annulee", color: "bg-red-50 text-red-700" },
};

export default function ReportsPage() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/history?date=${date}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
  };

  const isToday =
    date === new Date().toISOString().split("T")[0];
  const isYesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return date === d.toISOString().split("T")[0];
  })();

  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
          Historique
        </h1>
        <p className="text-[#86868b] text-sm mt-0.5">
          Revue des commandes et chiffre d&apos;affaires
        </p>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigateDate(-1)}
          className="h-9 w-9 rounded-xl bg-white border border-[#e5e5ea] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 text-[#1d1d1f]" />
        </button>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 px-3 rounded-xl bg-white border border-[#e5e5ea] text-sm text-[#1d1d1f] cursor-pointer"
          />
          {isToday && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[11px] font-medium">
              Aujourd&apos;hui
            </span>
          )}
          {isYesterday && (
            <span className="px-2 py-0.5 rounded-md bg-[#f5f5f7] text-[#86868b] text-[11px] font-medium">
              Hier
            </span>
          )}
        </div>
        <button
          onClick={() => navigateDate(1)}
          disabled={isToday}
          className="h-9 w-9 rounded-xl bg-white border border-[#e5e5ea] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4 text-[#1d1d1f]" />
        </button>
      </div>

      <p className="text-sm text-[#86868b] mb-4 capitalize">{dateLabel}</p>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white border border-[#e5e5ea] animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-white border border-[#e5e5ea] animate-pulse" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                  <TrendingUp className="h-[18px] w-[18px] text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
                  {formatPrice(stats.totalRevenue)}
                </p>
                <p className="text-[13px] text-[#86868b] mt-0.5">
                  Chiffre d&apos;affaires
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                  <ShoppingBag className="h-[18px] w-[18px] text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
                  {stats.completedOrders}
                </p>
                <p className="text-[13px] text-[#86868b] mt-0.5">
                  Commandes
                  {stats.cancelledOrders > 0 && (
                    <span className="text-red-500">
                      {" "}
                      ({stats.cancelledOrders} annulee
                      {stats.cancelledOrders > 1 ? "s" : ""})
                    </span>
                  )}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
                <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                  <Receipt className="h-[18px] w-[18px] text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
                  {formatPrice(stats.avgOrderValue)}
                </p>
                <p className="text-[13px] text-[#86868b] mt-0.5">
                  Panier moyen
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
                <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                  <Truck className="h-[18px] w-[18px] text-purple-600" />
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-lg font-bold text-[#1d1d1f] tabular-nums">
                    {stats.byType.collect}
                  </p>
                  <span className="text-xs text-[#86868b]">emporter</span>
                  <p className="text-lg font-bold text-[#1d1d1f] tabular-nums">
                    {stats.byType.delivery}
                  </p>
                  <span className="text-xs text-[#86868b]">livr.</span>
                </div>
                <p className="text-[13px] text-[#86868b] mt-0.5">
                  Repartition
                </p>
              </div>
            </div>
          )}

          {/* Orders list */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f0f0f2]">
              <h2 className="font-semibold text-[15px] text-[#1d1d1f]">
                Toutes les commandes ({orders.length})
              </h2>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingBag className="h-10 w-10 text-[#d1d1d6] mx-auto mb-3" />
                <p className="text-[#aeaeb2] text-sm">
                  Aucune commande ce jour
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f0f2]">
                {orders.map((order) => {
                  const TypeIcon =
                    typeLabels[order.order_type]?.icon || Store;
                  const statusInfo = statusLabels[order.status] || {
                    label: order.status,
                    color: "bg-[#f5f5f7] text-[#86868b]",
                  };

                  return (
                    <div
                      key={order.id}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3.5",
                        order.status === "cancelled" && "opacity-50"
                      )}
                    >
                      {/* Order number */}
                      <div className="h-10 w-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#1d1d1f] tabular-nums">
                          #{String(order.order_number).padStart(4, "0")}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#1d1d1f] truncate">
                            {order.customer_name || "Client"}
                          </p>
                          {order.customer_phone && (
                            <a
                              href={`tel:${order.customer_phone}`}
                              className="text-[#86868b] hover:text-blue-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <TypeIcon className="h-3 w-3 text-[#aeaeb2]" />
                          <span className="text-xs text-[#86868b]">
                            {typeLabels[order.order_type]?.label || order.order_type}
                          </span>
                          <span className="text-xs text-[#d1d1d6]">·</span>
                          <span className="text-xs text-[#86868b] tabular-nums">
                            {formatTime(order.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <span
                        className={cn(
                          "text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                          statusInfo.color
                        )}
                      >
                        {order.status === "cancelled" && (
                          <Ban className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                        )}
                        {statusInfo.label}
                      </span>

                      {/* Total */}
                      <span className="text-sm font-semibold text-[#1d1d1f] tabular-nums whitespace-nowrap">
                        {formatPrice(order.total)}
                      </span>

                      {/* Print ticket */}
                      <PrintTicketButton orderId={order.id} size="sm" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
