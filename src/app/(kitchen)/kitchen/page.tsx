"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  X,
  Phone,
  MapPin,
  Undo2,
  WifiOff,
  Truck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useSound } from "@/hooks/use-sound";
import { createClient } from "@/lib/supabase/client";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderWithItems } from "@/types/order";
import type { OrderStatus } from "@/types/database";
import { KitchenNav } from "@/components/kitchen/kitchen-nav";

/* ─────────────────────────────────────────────
   Flow ultra simple — Uber Eats style
   paid → preparing → ready → done
   ───────────────────────────────────────────── */

const LATE_THRESHOLD_MIN = 15;
const UNDO_DURATION_MS = 5000;

const COLUMNS: { key: string; label: string; status: OrderStatus }[] = [
  { key: "paid", label: "Nouvelles", status: "paid" },
  { key: "preparing", label: "En préparation", status: "preparing" },
  { key: "ready", label: "Prêtes", status: "ready" },
];

type FilterType = "all" | "dine_in" | "collect" | "delivery";

function getMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

type OrderTypeInfo = {
  label: string;
  icon: typeof Truck;
  className: string;
};

function orderTypeInfo(type: OrderWithItems["order_type"]): OrderTypeInfo {
  if (type === "delivery") {
    return {
      label: "Livraison",
      icon: Truck,
      className: "bg-[#e8416f]/10 text-[#e8416f]",
    };
  }
  if (type === "dine_in") {
    return {
      label: "Sur place",
      icon: Store,
      className: "bg-emerald-500/10 text-emerald-700",
    };
  }
  return {
    label: "À emporter",
    icon: ShoppingBag,
    className: "bg-[#1d1d1f]/5 text-[#1d1d1f]",
  };
}

function buttonLabel(order: OrderWithItems): string {
  if (order.status === "paid") return "Commencer";
  if (order.status === "preparing") return "Valider";
  if (order.status === "ready") {
    if (order.order_type === "delivery") return "Livrée";
    if (order.order_type === "dine_in") return "Servie";
    return "Récupérée";
  }
  return "";
}

function nextStatus(order: OrderWithItems): OrderStatus | null {
  if (order.status === "paid") return "preparing";
  if (order.status === "preparing") return "ready";
  if (order.status === "ready") {
    return order.order_type === "delivery" ? "out_for_delivery" : "picked_up";
  }
  return null;
}

/* ─────────────────────────────────────────────
   Order Card
   ───────────────────────────────────────────── */

function OrderCard({
  order,
  isPriority,
  onAdvance,
  onOpen,
}: {
  order: OrderWithItems;
  isPriority: boolean;
  onAdvance: () => void;
  onOpen: () => void;
}) {
  const minutes = getMinutes(order.created_at);
  const isLate = minutes >= LATE_THRESHOLD_MIN;
  const typeInfo = orderTypeInfo(order.order_type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      onClick={onOpen}
      className={cn(
        "bg-white rounded-2xl border p-5 cursor-pointer transition-shadow",
        isLate ? "border-red-300" : "border-[#e5e5ea]",
        isPriority && "shadow-md ring-2 ring-[#1d1d1f]/10"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
            #{String(order.order_number).padStart(4, "0")}
          </span>
          {isPriority && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1d1d1f] text-white shrink-0">
              À faire
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
              typeInfo.className
            )}
          >
            <typeInfo.icon className="h-3 w-3" />
            {typeInfo.label}
          </span>
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              isLate ? "text-red-500" : "text-[#86868b]"
            )}
          >
            {minutes} min
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        {order.order_items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#1d1d1f] tabular-nums shrink-0">
              {item.quantity}×
            </span>
            <span className="text-base text-[#1d1d1f] truncate">
              {item.item_name}
              {item.variant_name && (
                <span className="text-[#86868b] text-sm">
                  {" "}
                  · {item.variant_name}
                </span>
              )}
            </span>
          </div>
        ))}
        {order.order_items.length > 4 && (
          <p className="text-xs text-[#86868b] pl-6">
            +{order.order_items.length - 4} articles
          </p>
        )}
      </div>

      {/* Notes warning */}
      {(order.notes ||
        order.order_items.some((i) => i.special_instructions)) && (
        <div className="text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mb-3 line-clamp-2">
          {order.notes ||
            order.order_items.find((i) => i.special_instructions)
              ?.special_instructions}
        </div>
      )}

      {/* Customer name */}
      <p className="text-xs text-[#86868b] mb-3 truncate">
        {order.customer_name}
      </p>

      {/* Action button — single tap, big target */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdvance();
        }}
        className="w-full h-14 rounded-xl bg-[#1d1d1f] text-white font-semibold hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer"
      >
        {buttonLabel(order)}
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Order Detail Modal
   ───────────────────────────────────────────── */

function OrderDetail({
  order,
  onClose,
  onAdvance,
}: {
  order: OrderWithItems;
  onClose: () => void;
  onAdvance: () => void;
}) {
  const minutes = getMinutes(order.created_at);
  const isDelivery = order.order_type === "delivery";
  const typeInfo = orderTypeInfo(order.order_type);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 20, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[#e5e5ea] px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
              #{String(order.order_number).padStart(4, "0")}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                typeInfo.className
              )}
            >
              <typeInfo.icon className="h-3 w-3" />
              {typeInfo.label}
            </span>
            <span className="text-xs text-[#86868b] tabular-nums">
              · {minutes} min
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer */}
          <div>
            <p className="font-semibold text-[#1d1d1f]">
              {order.customer_name}
            </p>
            <a
              href={`tel:${order.customer_phone}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] mt-0.5"
            >
              <Phone className="h-3.5 w-3.5" />
              {order.customer_phone}
            </a>
          </div>

          {/* Delivery address */}
          {isDelivery && order.delivery_address && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f5f5f7] text-sm">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#86868b]" />
              <span className="text-[#1d1d1f]">
                {order.delivery_address.street},{" "}
                {order.delivery_address.postal_code}{" "}
                {order.delivery_address.city}
              </span>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 pb-3 border-b border-[#e5e5ea] last:border-0 last:pb-0"
              >
                <span className="text-lg font-bold text-[#1d1d1f] tabular-nums shrink-0">
                  {item.quantity}×
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1d1d1f]">
                    {item.item_name}
                    {item.variant_name && (
                      <span className="text-[#86868b] font-normal">
                        {" · "}
                        {item.variant_name}
                      </span>
                    )}
                  </p>
                  {item.extras_json &&
                    Array.isArray(item.extras_json) &&
                    (item.extras_json as Array<{ name: string }>).length >
                      0 && (
                      <p className="text-xs text-[#86868b] mt-0.5">
                        +{" "}
                        {(item.extras_json as Array<{ name: string }>)
                          .map((e) => e.name)
                          .join(", ")}
                      </p>
                    )}
                  {item.special_instructions && (
                    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1.5 inline-block">
                      {item.special_instructions}
                    </p>
                  )}
                </div>
                <span className="text-sm text-[#86868b] tabular-nums shrink-0">
                  {formatPrice(
                    (item.unit_price + item.extras_price) * item.quantity
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* General notes */}
          {order.notes && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1">
                Note client
              </p>
              <p className="text-sm text-[#1d1d1f]">{order.notes}</p>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-[#e5e5ea]">
            <span className="text-[#86868b]">Total</span>
            <span className="text-xl font-bold text-[#1d1d1f] tabular-nums">
              {formatPrice(order.total)}
            </span>
          </div>

          {/* Action */}
          <button
            onClick={onAdvance}
            className="w-full h-14 rounded-xl bg-[#1d1d1f] text-white font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            {buttonLabel(order)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
   ───────────────────────────────────────────── */

export default function KitchenPage() {
  const { orders, loading, updateOrderStatus } = useRealtimeOrders();
  const {
    play: playNewOrder,
    enabled: soundEnabled,
    setEnabled: setSoundEnabled,
  } = useSound("/sounds/new-order.mp3");

  const [selected, setSelected] = useState<OrderWithItems | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  // Lazy initializer — Date.now() is impure, so we wrap it so React only
  // calls it once on mount instead of on every render.
  const [now, setNow] = useState(() => Date.now());
  const [todayStats, setTodayStats] = useState({
    count: 0,
    total: 0,
    avgMin: 0,
  });
  const [online, setOnline] = useState(true);
  const [undoState, setUndoState] = useState<{
    orderId: string;
    prevStatus: OrderStatus;
    orderNumber: number;
  } | null>(null);

  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef = useRef(orders.length);

  /* ── Tick every 30s for timer refresh ── */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  /* ── Sound on new order ── */
  useEffect(() => {
    if (orders.length > prevCountRef.current) {
      playNewOrder();
    }
    prevCountRef.current = orders.length;
  }, [orders.length, playNewOrder]);

  /* ── Wake Lock — keep tablet screen awake ── */
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    async function request() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nav = navigator as any;
        if (nav.wakeLock) {
          lock = await nav.wakeLock.request("screen");
        }
      } catch {
        /* unsupported */
      }
    }
    request();
    const onVisibility = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => {});
    };
  }, []);

  /* ── Online status ── */
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    // Capture current online state on mount, deferred to a microtask so
    // the setState call doesn't run inside the synchronous effect body.
    queueMicrotask(() => setOnline(navigator.onLine));
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /* ── Today stats (refreshed every minute) ── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("orders")
        .select("total, created_at, updated_at, status")
        .gte("created_at", since.toISOString());
      if (cancelled || !data) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = data as any[];
      const total = rows.reduce((s, o) => s + (o.total || 0), 0);
      const completed = rows.filter((o) =>
        ["picked_up", "delivered", "out_for_delivery"].includes(o.status)
      );
      const avgMin =
        completed.length > 0
          ? Math.round(
              completed.reduce(
                (s, o) =>
                  s +
                  (new Date(o.updated_at).getTime() -
                    new Date(o.created_at).getTime()),
                0
              ) /
                completed.length /
                60000
            )
          : 0;
      setTodayStats({ count: rows.length, total, avgMin });
    }
    load();
    const t = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [orders.length]);

  /* ── Advance status with undo ── */
  const advance = useCallback(
    async (order: OrderWithItems) => {
      const next = nextStatus(order);
      if (!next) return;

      const prevStatus = order.status;
      const orderNumber = order.order_number;

      await updateOrderStatus(order.id, next);

      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoState({ orderId: order.id, prevStatus, orderNumber });
      undoTimerRef.current = setTimeout(() => {
        setUndoState(null);
      }, UNDO_DURATION_MS);

      if (selected?.id === order.id) setSelected(null);
    },
    [updateOrderStatus, selected]
  );

  const undo = useCallback(async () => {
    if (!undoState) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    await updateOrderStatus(undoState.orderId, undoState.prevStatus);
    setUndoState(null);
  }, [undoState, updateOrderStatus]);

  /* ── Filtered orders ── */
  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (filter === "all") return true;
        return o.order_type === filter;
      }),
    [orders, filter]
  );

  /* ── All-Day batch view (paid + preparing only) ── */
  const allDayItems = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filtered) {
      if (o.status !== "paid" && o.status !== "preparing") continue;
      for (const item of o.order_items) {
        map.set(item.item_name, (map.get(item.item_name) || 0) + item.quantity);
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  return (
    <div className="h-dvh flex flex-col">
      {/* ───── Header ───── */}
      <header className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[#1d1d1f] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">SS</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[#1d1d1f] truncate">Cuisine</h1>
              {!online && (
                <span className="flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                  <WifiOff className="h-3 w-3" />
                  Hors-ligne
                </span>
              )}
            </div>
            <p className="text-xs text-[#86868b] tabular-nums truncate">
              {new Date(now).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {filtered.length} en cours
            </p>
          </div>
        </div>

        {/* Kitchen subnav */}
        <div className="hidden md:block">
          <KitchenNav />
        </div>

        {/* Filter pills */}
        <div className="hidden lg:flex items-center gap-1 bg-[#f5f5f7] rounded-full p-1">
          {(
            [
              { key: "all", label: "Toutes" },
              { key: "dine_in", label: "Sur place" },
              { key: "collect", label: "À emporter" },
              { key: "delivery", label: "Livraison" },
            ] as { key: FilterType; label: string }[]
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                filter === f.key
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors shrink-0",
            soundEnabled
              ? "bg-[#1d1d1f] text-white"
              : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e5e5ea]"
          )}
          aria-label="Son"
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>
      </header>

      {/* ───── All-Day batch strip ───── */}
      {allDayItems.length > 0 && (
        <div className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 py-2.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mr-1 shrink-0">
              À produire
            </span>
            {allDayItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] shrink-0"
              >
                <span className="text-sm font-bold text-[#1d1d1f] tabular-nums">
                  {item.count}×
                </span>
                <span className="text-sm text-[#1d1d1f] whitespace-nowrap">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── 3 columns ───── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e5e5ea] overflow-hidden">
        {COLUMNS.map((col) => {
          const colOrders = filtered
            .filter((o) => o.status === col.status)
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );

          return (
            <div key={col.key} className="bg-[#f5f5f7] flex flex-col min-h-0">
              <div className="shrink-0 px-5 py-3 flex items-center justify-between bg-[#f5f5f7]">
                <h2 className="font-semibold text-[#1d1d1f]">{col.label}</h2>
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums px-2 py-0.5 rounded-full min-w-[1.5rem] text-center",
                    colOrders.length > 0
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#e5e5ea] text-[#86868b]"
                  )}
                >
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
                <AnimatePresence mode="popLayout">
                  {colOrders.map((order, idx) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isPriority={idx === 0}
                      onAdvance={() => advance(order)}
                      onOpen={() => setSelected(order)}
                    />
                  ))}
                </AnimatePresence>

                {colOrders.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <p className="text-sm text-[#86868b]/60">Vide</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ───── Footer stats ───── */}
      <footer className="shrink-0 bg-white border-t border-[#e5e5ea] px-5 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-5 text-[#86868b]">
          <span className="tabular-nums">
            <span className="font-bold text-[#1d1d1f]">
              {todayStats.count}
            </span>{" "}
            commandes
          </span>
          <span className="tabular-nums hidden sm:inline">
            <span className="font-bold text-[#1d1d1f]">
              {todayStats.avgMin}
            </span>
            min moyenne
          </span>
          <span className="tabular-nums">
            <span className="font-bold text-[#1d1d1f]">
              {formatPrice(todayStats.total)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#86868b]">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              online ? "bg-emerald-500" : "bg-red-500"
            )}
          />
          {online ? "Synchronisé" : "Hors-ligne"}
        </div>
      </footer>

      {/* ───── Detail modal ───── */}
      <AnimatePresence>
        {selected && (
          <OrderDetail
            order={selected}
            onClose={() => setSelected(null)}
            onAdvance={() => advance(selected)}
          />
        )}
      </AnimatePresence>

      {/* ───── Undo toast ───── */}
      <AnimatePresence>
        {undoState && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-[#1d1d1f] text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4">
              <span className="text-sm tabular-nums">
                #{String(undoState.orderNumber).padStart(4, "0")} avancée
              </span>
              <button
                onClick={undo}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
