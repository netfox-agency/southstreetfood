"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Clock,
  Package,
  ChefHat,
  Check,
  Truck,
  RotateCcw,
  LayoutGrid,
  List,
  X,
  Phone,
  MapPin,
} from "lucide-react";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useSound } from "@/hooks/use-sound";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderWithItems } from "@/types/order";
import type { OrderStatus } from "@/types/database";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Constants
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const THRESHOLD_YELLOW = 5; // minutes
const THRESHOLD_RED = 10; // minutes

const NEXT_STATUS: Record<string, OrderStatus> = {
  paid: "accepted",
  accepted: "preparing",
  preparing: "ready",
};

const STATUS_ACTION_LABEL: Record<string, string> = {
  paid: "Accepter",
  accepted: "Lancer",
  preparing: "Pret !",
  ready: "Recupere",
};

const STATUS_COLUMNS = [
  {
    key: "new",
    label: "Nouvelles",
    statuses: ["paid", "accepted"] as OrderStatus[],
    icon: Package,
    color: "text-blue-400",
  },
  {
    key: "prep",
    label: "En preparation",
    statuses: ["preparing"] as OrderStatus[],
    icon: ChefHat,
    color: "text-amber-400",
  },
  {
    key: "ready",
    label: "Pretes",
    statuses: ["ready"] as OrderStatus[],
    icon: Check,
    color: "text-emerald-400",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Timer helpers
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function getMinutesElapsed(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function getTimerColor(minutes: number): string {
  if (minutes >= THRESHOLD_RED) return "text-red-400 bg-red-400/10";
  if (minutes >= THRESHOLD_YELLOW) return "text-amber-400 bg-amber-400/10";
  return "text-emerald-400 bg-emerald-400/10";
}

function getCardBorder(minutes: number, status: OrderStatus): string {
  if (status === "ready") return "border-emerald-500/30";
  if (minutes >= THRESHOLD_RED) return "border-red-500/40 bg-red-500/[0.02]";
  if (minutes >= THRESHOLD_YELLOW) return "border-amber-500/30";
  return "border-white/[0.06]";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   All-Day View Component
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function AllDayView({ orders }: { orders: OrderWithItems[] }) {
  const itemCounts = new Map<string, { name: string; count: number }>();

  for (const order of orders) {
    for (const item of order.order_items) {
      const key = item.item_name;
      const existing = itemCounts.get(key);
      if (existing) {
        existing.count += item.quantity;
      } else {
        itemCounts.set(key, { name: item.item_name, count: item.quantity });
      }
    }
  }

  const sorted = Array.from(itemCounts.values()).sort(
    (a, b) => b.count - a.count
  );

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-lg font-bold text-white mb-4">
        All-Day ({orders.length} commandes)
      </h2>
      <div className="space-y-2">
        {sorted.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <span className="text-white text-sm font-medium">{item.name}</span>
            <span className="text-2xl font-black text-amber-400 tabular-nums">
              {item.count}
            </span>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-white/20 text-sm text-center py-8">
            Aucune commande active
          </p>
        )}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Order Detail Modal
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function OrderDetailModal({
  order,
  onClose,
  onAdvance,
  onRecall,
}: {
  order: OrderWithItems;
  onClose: () => void;
  onAdvance: () => void;
  onRecall?: () => void;
}) {
  const minutes = getMinutesElapsed(order.created_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#1c1c2e] rounded-3xl border border-white/10 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1c1c2e] border-b border-white/[0.06] p-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-white">
              #{String(order.order_number).padStart(4, "0")}
            </span>
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full",
                order.order_type === "delivery"
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-emerald-500/20 text-emerald-400"
              )}
            >
              {order.order_type === "delivery" ? "LIVRAISON" : "COLLECT"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Timer */}
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono",
              getTimerColor(minutes)
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {minutes} min
          </div>

          {/* Client info */}
          <div className="space-y-2">
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider">
              Client
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">
                {order.customer_name}
              </span>
              <a
                href={`tel:${order.customer_phone}`}
                className="flex items-center gap-1.5 text-blue-400 text-sm"
              >
                <Phone className="h-3.5 w-3.5" />
                {order.customer_phone}
              </a>
            </div>
          </div>

          {/* Delivery address */}
          {order.order_type === "delivery" && order.delivery_address && (
            <div className="space-y-1">
              <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider">
                Adresse
              </h3>
              <div className="flex items-start gap-2 text-white/70 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {order.delivery_address.street},{" "}
                  {order.delivery_address.postal_code}{" "}
                  {order.delivery_address.city}
                </span>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
              Articles
            </h3>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold text-sm bg-amber-400/10 rounded px-1.5 py-0.5 tabular-nums">
                        {item.quantity}x
                      </span>
                      <div>
                        <span className="text-white font-medium text-sm">
                          {item.item_name}
                        </span>
                        {item.variant_name && (
                          <span className="text-white/30 text-sm ml-1">
                            ({item.variant_name})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-white/40 text-sm tabular-nums">
                      {formatPrice(
                        (item.unit_price + item.extras_price) * item.quantity
                      )}
                    </span>
                  </div>

                  {item.extras_json &&
                    Array.isArray(item.extras_json) &&
                    (item.extras_json as Array<{ name: string }>).length > 0 && (
                      <p className="text-white/30 text-xs mt-1.5 ml-8">
                        +{" "}
                        {(item.extras_json as Array<{ name: string }>)
                          .map((e) => e.name)
                          .join(", ")}
                      </p>
                    )}

                  {item.special_instructions && (
                    <p className="text-amber-400 text-xs mt-1.5 ml-8 bg-amber-400/5 rounded px-2 py-1">
                      {item.special_instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/10">
              <p className="text-amber-400 text-sm">{order.notes}</p>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <span className="text-white/40 text-sm">Total</span>
            <span className="text-white font-bold text-lg tabular-nums">
              {formatPrice(order.total)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {onRecall && (
              <button
                onClick={onRecall}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-medium text-sm hover:bg-white/10 cursor-pointer transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Recall
              </button>
            )}
            <button
              onClick={onAdvance}
              className={cn(
                "flex-1 py-3.5 rounded-xl font-semibold text-sm cursor-pointer transition-all active:scale-[0.97]",
                order.status === "preparing"
                  ? "bg-amber-400 text-black hover:bg-amber-300"
                  : order.status === "ready"
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "bg-blue-500 text-white hover:bg-blue-400"
              )}
            >
              {order.status === "ready"
                ? order.order_type === "delivery"
                  ? "En livraison"
                  : "Recupere"
                : STATUS_ACTION_LABEL[order.status] || "Avancer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Order Card (compact, for kanban column)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function OrderCard({
  order,
  onBump,
  onTap,
}: {
  order: OrderWithItems;
  onBump: () => void;
  onTap: () => void;
}) {
  const minutes = getMinutesElapsed(order.created_at);
  const actionLabel =
    order.status === "ready"
      ? order.order_type === "delivery"
        ? "Envoyer"
        : "Recupere"
      : STATUS_ACTION_LABEL[order.status];

  return (
    <div
      onClick={onTap}
      className={cn(
        "rounded-2xl border p-4 cursor-pointer transition-all active:scale-[0.98]",
        getCardBorder(minutes, order.status)
      )}
    >
      {/* Header: number + type + timer */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-white tabular-nums">
            #{String(order.order_number).padStart(4, "0")}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
              order.order_type === "delivery"
                ? "bg-rose-500/20 text-rose-400"
                : "bg-emerald-500/20 text-emerald-400"
            )}
          >
            {order.order_type === "delivery" ? "LIV" : "COL"}
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full tabular-nums",
            getTimerColor(minutes)
          )}
        >
          <Clock className="h-3 w-3" />
          {minutes}m
        </div>
      </div>

      {/* Items — condensed */}
      <div className="space-y-1 mb-3">
        {order.order_items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="text-amber-400 text-xs font-bold tabular-nums shrink-0">
              {item.quantity}x
            </span>
            <span className="text-white/80 text-sm truncate">
              {item.item_name}
              {item.variant_name && (
                <span className="text-white/30"> ({item.variant_name})</span>
              )}
            </span>
          </div>
        ))}
        {order.order_items.length > 4 && (
          <p className="text-white/20 text-xs">
            +{order.order_items.length - 4} articles
          </p>
        )}
      </div>

      {/* Special instructions warning */}
      {(order.notes ||
        order.order_items.some((i) => i.special_instructions)) && (
        <div className="text-amber-400 text-xs bg-amber-400/5 rounded-lg px-2.5 py-1.5 mb-3 truncate">
          {order.notes ||
            order.order_items.find((i) => i.special_instructions)
              ?.special_instructions}
        </div>
      )}

      {/* Client name */}
      <p className="text-white/25 text-xs mb-3 truncate">
        {order.customer_name}
      </p>

      {/* Bump button — ONE TAP */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBump();
        }}
        className={cn(
          "w-full py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all active:scale-[0.95]",
          order.status === "paid" && "bg-blue-500 text-white hover:bg-blue-400",
          order.status === "accepted" &&
            "bg-blue-500 text-white hover:bg-blue-400",
          order.status === "preparing" &&
            "bg-amber-400 text-black hover:bg-amber-300",
          order.status === "ready" &&
            "bg-emerald-500 text-white hover:bg-emerald-400"
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN KITCHEN DASHBOARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function KitchenDashboard() {
  const { orders, loading, updateOrderStatus, refetch } = useRealtimeOrders();
  const {
    play: playNewOrder,
    enabled: soundEnabled,
    setEnabled: setSoundEnabled,
  } = useSound("/sounds/new-order.mp3");

  const [showAllDay, setShowAllDay] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [recalledOrders, setRecalledOrders] = useState<OrderWithItems[]>([]);
  const [now, setNow] = useState(Date.now());
  const prevOrderCount = useRef(orders.length);

  // Tick every 15s to update timers
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Sound on new order
  useEffect(() => {
    if (orders.length > prevOrderCount.current) {
      playNewOrder();
    }
    prevOrderCount.current = orders.length;
  }, [orders.length, playNewOrder]);

  // Bump = advance status
  const bumpOrder = useCallback(
    async (order: OrderWithItems) => {
      let nextStatus: OrderStatus;

      if (order.status === "ready") {
        nextStatus =
          order.order_type === "delivery" ? "out_for_delivery" : "picked_up";
      } else {
        nextStatus = NEXT_STATUS[order.status];
      }

      if (!nextStatus) return;

      const { error } = await updateOrderStatus(order.id, nextStatus);
      if (error) {
        console.error("Failed to bump:", error);
      }

      // Close modal if open
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
    },
    [updateOrderStatus, selectedOrder]
  );

  // Recall = undo last bump (go back one status)
  const recallOrder = useCallback(
    async (order: OrderWithItems) => {
      const PREV_STATUS: Record<string, OrderStatus> = {
        accepted: "paid",
        preparing: "accepted",
        ready: "preparing",
      };

      const prevStatus = PREV_STATUS[order.status];
      if (!prevStatus) return;

      await updateOrderStatus(order.id, prevStatus);
      setSelectedOrder(null);
    },
    [updateOrderStatus]
  );

  // Stats
  const activeOrders = orders.filter(
    (o) => !["picked_up", "delivered", "cancelled"].includes(o.status)
  );
  const todayTotal = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="h-dvh flex flex-col bg-[#0a0a12] select-none">
      {/* ── Header ────────────────────────────── */}
      <header className="shrink-0 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center justify-between">
          {/* Left: branding */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-xs">SS</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-sm">Cuisine</span>
              <span className="text-white/20 text-xs ml-2">
                {new Date(now).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Center: live stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xl font-black text-white tabular-nums">
                {activeOrders.length}
              </div>
              <div className="text-[9px] text-white/25 uppercase tracking-wider">
                En cours
              </div>
            </div>
            <div className="h-6 w-px bg-white/[0.06]" />
            <div className="text-center">
              <div className="text-xl font-black text-emerald-400 tabular-nums">
                {formatPrice(todayTotal)}
              </div>
              <div className="text-[9px] text-white/25 uppercase tracking-wider">
                Aujourd&apos;hui
              </div>
            </div>
          </div>

          {/* Right: toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAllDay(!showAllDay)}
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors",
                showAllDay
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-white/5 text-white/40 hover:text-white/60"
              )}
              title="All-Day View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors",
                soundEnabled
                  ? "bg-blue-400/20 text-blue-400"
                  : "bg-white/5 text-white/40 hover:text-white/60"
              )}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────── */}
      <div className="flex-1 overflow-hidden flex">
        {/* Kanban columns */}
        <div
          className={cn(
            "flex-1 grid divide-x divide-white/[0.04] overflow-hidden transition-all",
            showAllDay ? "grid-cols-4" : "grid-cols-3"
          )}
        >
          {STATUS_COLUMNS.map((col) => {
            const colOrders = orders
              .filter((o) => col.statuses.includes(o.status))
              .sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime()
              );

            return (
              <div key={col.key} className="flex flex-col h-full min-w-0">
                {/* Column header */}
                <div className="shrink-0 px-3 py-2.5 flex items-center justify-between border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <col.icon className={cn("h-4 w-4", col.color)} />
                    <span className="font-semibold text-sm text-white/60">
                      {col.label}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full tabular-nums",
                      colOrders.length > 0
                        ? "bg-white/10 text-white/70"
                        : "text-white/20"
                    )}
                  >
                    {colOrders.length}
                  </span>
                </div>

                {/* Orders */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {colOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onBump={() => bumpOrder(order)}
                      onTap={() => setSelectedOrder(order)}
                    />
                  ))}

                  {colOrders.length === 0 && (
                    <div className="text-center py-12">
                      <col.icon className="h-8 w-8 mx-auto text-white/[0.06] mb-2" />
                      <p className="text-white/15 text-xs">Vide</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* All-Day column (optional) */}
          {showAllDay && <AllDayView orders={activeOrders} />}
        </div>
      </div>

      {/* ── Footer stats ──────────────────────── */}
      <footer className="shrink-0 border-t border-white/[0.04] bg-white/[0.02] px-4 py-2">
        <div className="flex items-center justify-between text-xs text-white/25">
          <span>
            {loading
              ? "Connexion..."
              : `Realtime actif · ${orders.length} commandes`}
          </span>
          <span>South Street Food — Cuisine</span>
        </div>
      </footer>

      {/* ── Order Detail Modal ────────────────── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAdvance={() => bumpOrder(selectedOrder)}
          onRecall={
            selectedOrder.status !== "paid"
              ? () => recallOrder(selectedOrder)
              : undefined
          }
        />
      )}
    </div>
  );
}
