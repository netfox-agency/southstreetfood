"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, VolumeX, X, Phone, MapPin } from "lucide-react";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useSound } from "@/hooks/use-sound";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderWithItems } from "@/types/order";
import type { OrderStatus } from "@/types/database";

/* ─────────────────────────────────────────────
   Flow ultra-simple :
   paid → preparing → ready → done (picked_up | delivered)
   ───────────────────────────────────────────── */

const COLUMNS: Array<{
  key: "new" | "prep" | "ready";
  label: string;
  status: OrderStatus;
}> = [
  { key: "new", label: "Nouvelles", status: "paid" },
  { key: "prep", label: "En préparation", status: "preparing" },
  { key: "ready", label: "Prêtes", status: "ready" },
];

function getMinutes(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

/* ─────────────────────────────────────────────
   Order Card — minimal, 1 tap
   ───────────────────────────────────────────── */

function OrderCard({
  order,
  onAdvance,
  onOpen,
}: {
  order: OrderWithItems;
  onAdvance: () => void;
  onOpen: () => void;
}) {
  const minutes = getMinutes(order.created_at);
  const isLate = minutes >= 15;
  const isDelivery = order.order_type === "delivery";

  const buttonLabel =
    order.status === "paid"
      ? "Commencer"
      : order.status === "preparing"
      ? "Prête"
      : isDelivery
      ? "Livrée"
      : "Servie";

  return (
    <div
      onClick={onOpen}
      className={cn(
        "bg-white rounded-2xl border p-4 cursor-pointer transition-all active:scale-[0.98]",
        isLate ? "border-red-300" : "border-[#e5e5ea]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
          #{String(order.order_number).padStart(4, "0")}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
              isDelivery
                ? "bg-[#e8416f]/10 text-[#e8416f]"
                : "bg-[#1d1d1f]/5 text-[#1d1d1f]"
            )}
          >
            {isDelivery ? "Livraison" : "Sur place"}
          </span>
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              isLate ? "text-red-500" : "text-[#86868b]"
            )}
          >
            {minutes}min
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.order_items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-[#1d1d1f] tabular-nums">
              {item.quantity}×
            </span>
            <span className="text-[#1d1d1f] truncate">
              {item.item_name}
              {item.variant_name && (
                <span className="text-[#86868b]"> · {item.variant_name}</span>
              )}
            </span>
          </div>
        ))}
        {order.order_items.length > 4 && (
          <p className="text-xs text-[#86868b] pl-5">
            +{order.order_items.length - 4} articles
          </p>
        )}
      </div>

      {/* Notes warning */}
      {(order.notes ||
        order.order_items.some((i) => i.special_instructions)) && (
        <div className="text-xs text-[#1d1d1f] bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mb-3 line-clamp-2">
          {order.notes ||
            order.order_items.find((i) => i.special_instructions)
              ?.special_instructions}
        </div>
      )}

      {/* Customer name */}
      <p className="text-xs text-[#86868b] mb-3 truncate">
        {order.customer_name}
      </p>

      {/* Single action button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdvance();
        }}
        className="w-full py-3 rounded-xl bg-[#1d1d1f] text-white font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Detail modal — full info, optional actions
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

  const buttonLabel =
    order.status === "paid"
      ? "Commencer la préparation"
      : order.status === "preparing"
      ? "Marquer comme prête"
      : isDelivery
      ? "Marquer comme livrée"
      : "Marquer comme servie";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e5e5ea] px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
              #{String(order.order_number).padStart(4, "0")}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                isDelivery
                  ? "bg-[#e8416f]/10 text-[#e8416f]"
                  : "bg-[#1d1d1f]/5 text-[#1d1d1f]"
              )}
            >
              {isDelivery ? "Livraison" : "Sur place"}
            </span>
            <span className="text-xs text-[#86868b] tabular-nums">
              · {minutes}min
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer */}
          <div className="flex items-center justify-between">
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
                <span className="font-bold text-[#1d1d1f] tabular-nums shrink-0">
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
                    <p className="text-xs text-[#1d1d1f] bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1.5 inline-block">
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
                Note
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
            className="w-full py-4 rounded-xl bg-[#1d1d1f] text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────── */

export default function KitchenPage() {
  const { orders, loading, updateOrderStatus } = useRealtimeOrders();
  const {
    play: playNewOrder,
    enabled: soundEnabled,
    setEnabled: setSoundEnabled,
  } = useSound("/sounds/new-order.mp3");

  const [selected, setSelected] = useState<OrderWithItems | null>(null);
  const [now, setNow] = useState(Date.now());
  const prevCount = useRef(orders.length);

  // Tick to refresh timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Sound on new order
  useEffect(() => {
    if (orders.length > prevCount.current) playNewOrder();
    prevCount.current = orders.length;
  }, [orders.length, playNewOrder]);

  // Advance status: paid → preparing → ready → done
  const advance = useCallback(
    async (order: OrderWithItems) => {
      let next: OrderStatus;
      if (order.status === "paid") next = "preparing";
      else if (order.status === "preparing") next = "ready";
      else if (order.status === "ready")
        next = order.order_type === "delivery" ? "delivered" : "picked_up";
      else return;

      await updateOrderStatus(order.id, next);
      if (selected?.id === order.id) setSelected(null);
    },
    [updateOrderStatus, selected]
  );

  // Group orders by column
  const byStatus = (status: OrderStatus) =>
    orders
      .filter((o) => o.status === status)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

  return (
    <div className="h-dvh flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#e5e5ea] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#1d1d1f] flex items-center justify-center">
            <span className="text-white font-bold text-xs">SS</span>
          </div>
          <div>
            <h1 className="font-bold text-[#1d1d1f]">Cuisine</h1>
            <p className="text-xs text-[#86868b] tabular-nums">
              {new Date(now).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {orders.length} commande{orders.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors",
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

      {/* Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e5e5ea] overflow-hidden">
        {COLUMNS.map((col) => {
          const colOrders = byStatus(col.status);
          return (
            <div
              key={col.key}
              className="bg-[#f5f5f7] flex flex-col min-h-0"
            >
              <div className="shrink-0 px-5 py-3 flex items-center justify-between bg-[#f5f5f7]">
                <h2 className="font-semibold text-[#1d1d1f]">{col.label}</h2>
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums px-2 py-0.5 rounded-full",
                    colOrders.length > 0
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#e5e5ea] text-[#86868b]"
                  )}
                >
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
                {colOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAdvance={() => advance(order)}
                    onOpen={() => setSelected(order)}
                  />
                ))}

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

      {/* Detail modal */}
      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onAdvance={() => advance(selected)}
        />
      )}
    </div>
  );
}
