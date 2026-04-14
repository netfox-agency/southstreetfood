"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Search,
  Truck,
  ShoppingBag,
  Store,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { KitchenNav } from "@/components/kitchen/kitchen-nav";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderWithItems } from "@/types/order";
import type { OrderStatus, OrderType } from "@/types/database";

type Props = {
  initialOrders: OrderWithItems[];
  initialDate: string;
};

type FilterType = "all" | OrderType;
type StatusFilter = "all" | "done" | "cancelled";

const TERMINAL_DONE: OrderStatus[] = ["picked_up", "delivered", "out_for_delivery"];
const TERMINAL_CANCELLED: OrderStatus[] = ["cancelled", "refunded"];

function typePill(type: OrderType) {
  if (type === "delivery")
    return { label: "Livraison", icon: Truck, cls: "bg-[#e8416f]/10 text-[#e8416f]" };
  if (type === "dine_in")
    return { label: "Sur place", icon: Store, cls: "bg-emerald-500/10 text-emerald-700" };
  return { label: "À emporter", icon: ShoppingBag, cls: "bg-[#1d1d1f]/5 text-[#1d1d1f]" };
}

function statusLabel(status: OrderStatus): { label: string; done: boolean } {
  if (status === "cancelled") return { label: "Annulée", done: false };
  if (status === "refunded") return { label: "Remboursée", done: false };
  if (status === "delivered") return { label: "Livrée", done: true };
  if (status === "picked_up") return { label: "Récupérée", done: true };
  if (status === "out_for_delivery") return { label: "En livraison", done: true };
  if (status === "ready") return { label: "Prête", done: true };
  if (status === "preparing") return { label: "En prep", done: false };
  return { label: status, done: false };
}

export function HistoryClient({ initialOrders, initialDate }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onChangeDate = (d: string) => {
    setDate(d);
    router.push(`/kitchen/history?date=${d}`);
  };

  const refresh = () => {
    setRefreshing(true);
    router.refresh();
    // Little visual feedback — reset after a tick.
    setTimeout(() => setRefreshing(false), 500);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialOrders.filter((o) => {
      if (typeFilter !== "all" && o.order_type !== typeFilter) return false;
      if (statusFilter === "done" && !TERMINAL_DONE.includes(o.status)) return false;
      if (statusFilter === "cancelled" && !TERMINAL_CANCELLED.includes(o.status))
        return false;
      if (q) {
        const hay = `${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [initialOrders, typeFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const completed = filtered.filter((o) => TERMINAL_DONE.includes(o.status));
    const cancelled = filtered.filter((o) => TERMINAL_CANCELLED.includes(o.status));
    const revenue = completed.reduce((s, o) => s + (o.total ?? 0), 0);

    const prepTimes = completed
      .map((o) => {
        const created = new Date(o.created_at).getTime();
        const updated = new Date(o.updated_at).getTime();
        return Math.max(0, Math.round((updated - created) / 60000));
      })
      .filter((n) => Number.isFinite(n) && n > 0 && n < 360); // sanity clamp
    const avgMin =
      prepTimes.length > 0
        ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
        : 0;

    const itemCount = completed.reduce(
      (s, o) => s + o.order_items.reduce((a, i) => a + i.quantity, 0),
      0
    );
    return {
      total: filtered.length,
      completed: completed.length,
      cancelled: cancelled.length,
      revenue,
      avgMin,
      itemCount,
    };
  }, [filtered]);

  const maxDate = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[#1d1d1f] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">SS</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-[#1d1d1f] truncate">Historique</h1>
            <p className="text-xs text-[#86868b] truncate">
              {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="hidden md:block">
          <KitchenNav />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b] pointer-events-none" />
            <input
              type="date"
              value={date}
              max={maxDate}
              onChange={(e) => onChangeDate(e.target.value)}
              className="h-10 pl-9 pr-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10"
            />
          </div>
          <button
            onClick={refresh}
            className="h-10 w-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] cursor-pointer"
            aria-label="Rafraîchir"
          >
            <RefreshCw
              className={cn("h-4 w-4 text-[#1d1d1f]", refreshing && "animate-spin")}
            />
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 py-4 grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Commandes" value={stats.total.toString()} />
        <Stat
          label="Terminées"
          value={stats.completed.toString()}
          sub={
            stats.total > 0
              ? `${Math.round((stats.completed / stats.total) * 100)}%`
              : "—"
          }
        />
        <Stat
          label="Annulées"
          value={stats.cancelled.toString()}
          sub={
            stats.total > 0
              ? `${Math.round((stats.cancelled / stats.total) * 100)}%`
              : "—"
          }
        />
        <Stat label="Temps moyen" value={`${stats.avgMin} min`} />
        <Stat label="Chiffre" value={formatPrice(stats.revenue)} />
      </div>

      {/* Filters */}
      <div className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-[#f5f5f7] rounded-full p-1">
          {(
            [
              { key: "all", label: "Tous types" },
              { key: "collect", label: "À emporter" },
              { key: "delivery", label: "Livraison" },
            ] as { key: FilterType; label: string }[]
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                "px-3 h-8 rounded-full text-[13px] font-medium transition-all cursor-pointer",
                typeFilter === f.key
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-[#f5f5f7] rounded-full p-1">
          {(
            [
              { key: "all", label: "Tous statuts" },
              { key: "done", label: "Terminées" },
              { key: "cancelled", label: "Annulées" },
            ] as { key: StatusFilter; label: string }[]
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "px-3 h-8 rounded-full text-[13px] font-medium transition-all cursor-pointer",
                statusFilter === f.key
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b] pointer-events-none" />
          <input
            type="text"
            placeholder="N°, nom, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-full bg-[#f5f5f7] border-0 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-[#86868b]">Aucune commande</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((o) => {
              const t = typePill(o.order_type);
              const st = statusLabel(o.status);
              const itemCount = o.order_items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={o.id}
                  className="bg-white rounded-2xl border border-[#e5e5ea] p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl font-bold text-[#1d1d1f] tabular-nums">
                      #{String(o.order_number).padStart(4, "0")}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        t.cls
                      )}
                    >
                      <t.icon className="h-3 w-3" />
                      {t.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#1d1d1f] truncate">
                    {o.customer_name}
                  </p>
                  <p className="text-xs text-[#86868b] truncate">
                    {itemCount} article{itemCount > 1 ? "s" : ""} ·{" "}
                    {new Date(o.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="mt-3 pt-3 border-t border-[#f0f0f2] flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-semibold",
                        st.done ? "text-emerald-600" : "text-[#86868b]",
                        TERMINAL_CANCELLED.includes(o.status) && "text-red-500"
                      )}
                    >
                      {st.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : TERMINAL_CANCELLED.includes(o.status) ? (
                        <XCircle className="h-3.5 w-3.5" />
                      ) : null}
                      {st.label}
                    </span>
                    <span className="text-sm font-bold text-[#1d1d1f] tabular-nums">
                      {formatPrice(o.total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#86868b] tabular-nums">{sub}</p>}
    </div>
  );
}
