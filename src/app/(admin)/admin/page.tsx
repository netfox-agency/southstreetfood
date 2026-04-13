"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Truck,
  Store,
  MapPin,
} from "lucide-react";

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  total: number;
  status: string;
  order_type: string;
  created_at: string;
};

const formatPrice = (cents: number) =>
  `${(cents / 100).toFixed(2).replace(".", ",")} €`;

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const typeIcons: Record<string, typeof Store> = {
  dine_in: Store,
  collect: MapPin,
  delivery: Truck,
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const [ordRes, histRes, custRes] = await Promise.all([
        fetch(`/api/orders?date=${today}`).catch(() => null),
        fetch(`/api/orders/history?date=${yesterdayStr}`).catch(() => null),
        fetch("/api/customers").catch(() => null),
      ]);

      if (ordRes) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || []);
      }
      if (histRes) {
        const histData = await histRes.json();
        setYesterdayRevenue(histData.stats?.totalRevenue || 0);
      }
      if (custRes) {
        const custData = await custRes.json();
        setTotalCustomers(custData.totalCustomers || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeOrders = orders.filter((o) =>
    ["paid", "preparing", "ready"].includes(o.status)
  );
  const todayRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const stats = [
    {
      title: "Commandes",
      value: orders.length,
      sub: `${activeOrders.length} en cours`,
      icon: ShoppingBag,
      color: "bg-orange-50 text-orange-600",
      href: "/admin/orders",
    },
    {
      title: "CA aujourd'hui",
      value: formatPrice(todayRevenue),
      sub: "en cours",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
      href: "/admin/reports",
    },
    {
      title: "CA hier",
      value: formatPrice(yesterdayRevenue),
      sub: "cloture",
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
      href: "/admin/reports",
    },
    {
      title: "Clients",
      value: totalCustomers,
      sub: "base clients",
      icon: Users,
      color: "bg-purple-50 text-purple-600",
      href: "/admin/customers",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
          Dashboard
        </h1>
        <p className="text-[#86868b] text-sm mt-0.5">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-white rounded-2xl border border-[#e5e5ea] p-5 hover:border-[#c7c7cc] transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="h-[18px] w-[18px]" />
              </div>
              <ArrowRight className="h-4 w-4 text-[#d1d1d6] group-hover:text-[#86868b] transition-colors" />
            </div>
            <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
              {stat.value}
            </p>
            <p className="text-[13px] text-[#86868b] mt-0.5">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Active orders alert */}
      {activeOrders.length > 0 && (
        <Link
          href="/admin/orders"
          className="block mb-6 p-4 rounded-2xl bg-orange-50 border border-orange-100 hover:bg-orange-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[15px] font-semibold text-orange-800">
              {activeOrders.length} commande{activeOrders.length > 1 ? "s" : ""}{" "}
              en cours
            </span>
            <ArrowRight className="h-4 w-4 text-orange-400 ml-auto" />
          </div>
        </Link>
      )}

      {/* Quick access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders preview */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f2]">
            <h2 className="font-semibold text-[15px] text-[#1d1d1f]">
              Dernieres commandes
            </h2>
            <Link
              href="/admin/orders"
              className="text-[13px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              Voir tout
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-[#f5f5f7] animate-pulse"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#aeaeb2] text-sm">
                Aucune commande aujourd&apos;hui
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f0f2]">
              {orders.slice(0, 6).map((o) => {
                const TypeIcon = typeIcons[o.order_type] || Store;
                return (
                  <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                      <TypeIcon className="h-3.5 w-3.5 text-[#86868b]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1d1d1f] truncate">
                        {o.customer_name || "Client"}{" "}
                        <span className="text-[#aeaeb2] font-normal">
                          #{String(o.order_number).padStart(4, "0")}
                        </span>
                      </p>
                      <p className="text-xs text-[#86868b]">
                        {formatTime(o.created_at)}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        ["paid", "preparing", "ready"].includes(o.status)
                          ? "bg-orange-50 text-orange-600"
                          : o.status === "cancelled"
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {o.status === "paid"
                        ? "Nouvelle"
                        : o.status === "preparing"
                        ? "En cours"
                        : o.status === "ready"
                        ? "Prete"
                        : o.status === "cancelled"
                        ? "Annulee"
                        : "Terminee"}
                    </span>
                    <span className="text-sm font-semibold text-[#1d1d1f] tabular-nums">
                      {formatPrice(o.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <Link
            href="/admin/orders"
            className="flex items-center gap-4 bg-white rounded-2xl border border-[#e5e5ea] p-5 hover:border-[#c7c7cc] transition-colors group"
          >
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px] text-[#1d1d1f]">
                Commandes en direct
              </p>
              <p className="text-[13px] text-[#86868b]">
                Gerer les commandes en temps reel
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#d1d1d6] group-hover:text-[#86868b] transition-colors" />
          </Link>

          <Link
            href="/admin/reports"
            className="flex items-center gap-4 bg-white rounded-2xl border border-[#e5e5ea] p-5 hover:border-[#c7c7cc] transition-colors group"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px] text-[#1d1d1f]">
                Historique &amp; chiffres
              </p>
              <p className="text-[13px] text-[#86868b]">
                Revue journaliere, CA, details
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#d1d1d6] group-hover:text-[#86868b] transition-colors" />
          </Link>

          <Link
            href="/kitchen"
            className="flex items-center gap-4 bg-white rounded-2xl border border-[#e5e5ea] p-5 hover:border-[#c7c7cc] transition-colors group"
          >
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px] text-[#1d1d1f]">
                Vue cuisine
              </p>
              <p className="text-[13px] text-[#86868b]">
                Ecran commandes en temps reel
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#d1d1d6] group-hover:text-[#86868b] transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
