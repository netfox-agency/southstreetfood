"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarDays,
  Check,
  X,
  Phone,
  Users,
  Clock,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  UserCheck,
  Ban,
} from "lucide-react";

type Reservation = {
  id: string;
  reservation_number: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  notes: string | null;
  status: string;
  created_at: string;
  treated_at: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  seated: "Installee",
  completed: "Terminee",
  cancelled: "Annulee",
  no_show: "Absent",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-50 text-orange-600 border-orange-100",
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  seated: "bg-emerald-50 text-emerald-600 border-emerald-100",
  completed: "bg-[#f5f5f7] text-[#86868b] border-[#e5e5ea]",
  cancelled: "bg-red-50 text-red-500 border-red-100",
  no_show: "bg-red-50 text-red-500 border-red-100",
};

const FILTER_TABS = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "confirmed", label: "Confirmees" },
  { key: "seated", label: "En salle" },
  { key: "completed", label: "Terminees" },
];

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/reservations?${params}`);
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch {
      console.error("Fetch error");
    } finally {
      setLoading(false);
    }
  }, [date, filter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("reservations-realtime")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "reservations" },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservations]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch {
      console.error("Update error");
    } finally {
      setUpdating(null);
    }
  };

  const changeDate = (offset: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split("T")[0]);
  };

  const exportCSV = () => {
    const headers = ["#", "Nom", "Tel", "Personnes", "Date", "Heure", "Statut", "Notes"];
    const rows = reservations.map((r) => [
      r.reservation_number,
      r.customer_name,
      r.customer_phone,
      r.party_size,
      r.reservation_date,
      r.reservation_time,
      STATUS_LABELS[r.status] || r.status,
      r.notes || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    covers: reservations
      .filter((r) => !["cancelled", "no_show"].includes(r.status))
      .reduce((sum, r) => sum + r.party_size, 0),
  };

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const isToday = date === new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Reservations</h1>
          <p className="text-[#86868b] text-sm mt-0.5">
            {stats.total} reservation{stats.total > 1 ? "s" : ""} &middot; {stats.covers} couvert{stats.covers > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReservations}
            className="h-9 w-9 rounded-lg border border-[#e5e5ea] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-[#86868b] ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportCSV}
            className="h-9 px-3 rounded-lg border border-[#e5e5ea] flex items-center gap-2 text-[13px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Exporter
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
            <span className="text-[11px] font-medium bg-[#1d1d1f] text-white px-2 py-0.5 rounded-full">
              Aujourd&apos;hui
            </span>
          )}
        </div>
        <button onClick={() => changeDate(1)} className="h-9 w-9 rounded-lg border border-[#e5e5ea] flex items-center justify-center hover:bg-[#f5f5f7] cursor-pointer">
          <ChevronRight className="h-4 w-4 text-[#86868b]" />
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#e5e5ea] text-sm text-[#1d1d1f] bg-white cursor-pointer"
        />
      </div>

      {/* Stats pills */}
      {stats.pending > 0 && (
        <div className="mb-5 p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm font-medium text-orange-700">
            {stats.pending} reservation{stats.pending > 1 ? "s" : ""} en attente de confirmation
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all cursor-pointer ${
              filter === tab.key
                ? "bg-[#1d1d1f] text-white"
                : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e5e5ea] hover:text-[#1d1d1f]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reservations list — Uber Eats style */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#f5f5f7] animate-pulse" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="h-10 w-10 text-[#d1d1d6] mx-auto mb-3" />
          <p className="text-[#86868b] text-[15px]">Aucune reservation pour cette date</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-[#e5e5ea] overflow-hidden transition-all"
            >
              {/* Main row */}
              <button
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#fafafa] transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-[#f5f5f7] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#1d1d1f]">
                    {r.customer_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] text-[#1d1d1f] truncate">
                      {r.customer_name}
                    </span>
                    <span className="text-[#aeaeb2] text-xs">#{r.reservation_number}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#86868b] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {r.party_size}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {r.reservation_time.slice(0, 5)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {r.customer_phone}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={`px-3 py-1 rounded-full text-[12px] font-medium border ${
                    STATUS_COLORS[r.status] || "bg-gray-50 text-gray-600"
                  }`}
                >
                  {STATUS_LABELS[r.status] || r.status}
                </span>
              </button>

              {/* Expanded detail */}
              {expandedId === r.id && (
                <div className="px-4 pb-4 border-t border-[#f0f0f2]">
                  <div className="pt-3 space-y-3">
                    {r.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-[#86868b] mt-0.5 shrink-0" />
                        <span className="text-[#1d1d1f]">{r.notes}</span>
                      </div>
                    )}
                    {r.customer_email && (
                      <p className="text-sm text-[#86868b]">Email: {r.customer_email}</p>
                    )}
                    <p className="text-xs text-[#aeaeb2]">
                      Creee le {new Date(r.created_at).toLocaleString("fr-FR")}
                      {r.treated_at && ` · Traitee le ${new Date(r.treated_at).toLocaleString("fr-FR")}`}
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {r.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(r.id, "confirmed")}
                            disabled={updating === r.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-[#1d1d1f]/90 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirmer
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, "cancelled")}
                            disabled={updating === r.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f5f5f7] text-red-500 text-[13px] font-medium hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Refuser
                          </button>
                        </>
                      )}
                      {r.status === "confirmed" && (
                        <>
                          <button
                            onClick={() => updateStatus(r.id, "seated")}
                            disabled={updating === r.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-[#1d1d1f]/90 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Installer
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, "no_show")}
                            disabled={updating === r.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f5f5f7] text-red-500 text-[13px] font-medium hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Absent
                          </button>
                        </>
                      )}
                      {r.status === "seated" && (
                        <button
                          onClick={() => updateStatus(r.id, "completed")}
                          disabled={updating === r.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-[13px] font-medium hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Terminee
                        </button>
                      )}
                      {/* Phone link */}
                      <a
                        href={`tel:${r.customer_phone}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f5f5f7] text-[#1d1d1f] text-[13px] font-medium hover:bg-[#e5e5ea] transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Appeler
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
