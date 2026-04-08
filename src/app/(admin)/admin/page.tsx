"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  CalendarCheck,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

type Reservation = {
  id: string;
  reservation_number: number;
  customer_name: string;
  party_size: number;
  reservation_time: string;
  status: string;
};

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, ordRes] = await Promise.all([
        fetch(`/api/reservations?date=${today}`),
        fetch(`/api/orders?date=${today}`).catch(() => null),
      ]);
      const resData = await resRes.json();
      setReservations(resData.reservations || []);
      if (ordRes) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || []);
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

  const pendingRes = reservations.filter((r) => r.status === "pending").length;
  const confirmedRes = reservations.filter((r) => r.status === "confirmed").length;
  const totalCovers = reservations
    .filter((r) => !["cancelled", "no_show"].includes(r.status))
    .reduce((sum, r) => sum + r.party_size, 0);

  const stats = [
    {
      title: "Reservations",
      value: reservations.length,
      sub: `${pendingRes} en attente`,
      icon: CalendarCheck,
      color: "bg-blue-50 text-blue-600",
      href: "/admin/reservations",
    },
    {
      title: "Couverts prevus",
      value: totalCovers,
      sub: `${confirmedRes} confirmees`,
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
      href: "/admin/reservations",
    },
    {
      title: "Commandes",
      value: orders.length,
      sub: "aujourd'hui",
      icon: ShoppingBag,
      color: "bg-orange-50 text-orange-600",
      href: "/admin/orders",
    },
    {
      title: "Service",
      value: new Date().getHours() < 15 ? "Midi" : "Soir",
      sub: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      icon: Clock,
      color: "bg-purple-50 text-purple-600",
      href: "#",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Dashboard</h1>
        <p className="text-[#86868b] text-sm mt-0.5">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
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
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-[18px] w-[18px]" />
              </div>
              <ArrowRight className="h-4 w-4 text-[#d1d1d6] group-hover:text-[#86868b] transition-colors" />
            </div>
            <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">{stat.value}</p>
            <p className="text-[13px] text-[#86868b] mt-0.5">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Pending alert */}
      {pendingRes > 0 && (
        <Link
          href="/admin/reservations"
          className="block mb-6 p-4 rounded-2xl bg-orange-50 border border-orange-100 hover:bg-orange-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[15px] font-semibold text-orange-800">
              {pendingRes} reservation{pendingRes > 1 ? "s" : ""} a confirmer
            </span>
            <ArrowRight className="h-4 w-4 text-orange-400 ml-auto" />
          </div>
        </Link>
      )}

      {/* Quick access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's reservations preview */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f2]">
            <h2 className="font-semibold text-[15px] text-[#1d1d1f]">Reservations du jour</h2>
            <Link href="/admin/reservations" className="text-[13px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors">
              Voir tout
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-[#f5f5f7] animate-pulse" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#aeaeb2] text-sm">Aucune reservation</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f0f2]">
              {reservations.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#1d1d1f]">
                      {r.customer_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1d1d1f] truncate">{r.customer_name}</p>
                    <p className="text-xs text-[#86868b]">{r.party_size} pers. &middot; {r.reservation_time.slice(0, 5)}</p>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      r.status === "pending"
                        ? "bg-orange-50 text-orange-600"
                        : r.status === "confirmed"
                        ? "bg-blue-50 text-blue-600"
                        : r.status === "seated"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-[#f5f5f7] text-[#86868b]"
                    }`}
                  >
                    {r.status === "pending" ? "En attente" : r.status === "confirmed" ? "Confirmee" : r.status === "seated" ? "En salle" : "Terminee"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <Link
            href="/admin/reservations"
            className="flex items-center gap-4 bg-white rounded-2xl border border-[#e5e5ea] p-5 hover:border-[#c7c7cc] transition-colors group"
          >
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <CalendarCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px] text-[#1d1d1f]">Gerer les reservations</p>
              <p className="text-[13px] text-[#86868b]">Confirmer, installer, exporter</p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#d1d1d6] group-hover:text-[#86868b] transition-colors" />
          </Link>

          <Link
            href="/kitchen"
            className="flex items-center gap-4 bg-white rounded-2xl border border-[#e5e5ea] p-5 hover:border-[#c7c7cc] transition-colors group"
          >
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px] text-[#1d1d1f]">Vue cuisine</p>
              <p className="text-[13px] text-[#86868b]">Ecran commandes en temps reel</p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#d1d1d6] group-hover:text-[#86868b] transition-colors" />
          </Link>

          <Link
            href="/admin/menu"
            className="flex items-center gap-4 bg-white rounded-2xl border border-[#e5e5ea] p-5 hover:border-[#c7c7cc] transition-colors group"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px] text-[#1d1d1f]">Gerer le menu</p>
              <p className="text-[13px] text-[#86868b]">Activer/desactiver les plats</p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#d1d1d6] group-hover:text-[#86868b] transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
