"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChefHat,
  Volume2,
  VolumeX,
  Clock,
  Package,
  Truck,
  Check,
  List,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSound } from "@/hooks/use-sound";
import { formatPrice, formatTime } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OrderWithItems } from "@/types/order";
import type { OrderStatus } from "@/types/database";

// Demo orders for initial build
const DEMO_ORDERS: OrderWithItems[] = [
  {
    id: "ord-1",
    order_number: 42,
    user_id: null,
    order_type: "collect",
    status: "paid",
    payment_status: "succeeded",
    stripe_payment_intent_id: null,
    subtotal: 1340,
    delivery_fee: 0,
    discount_amount: 0,
    total: 1340,
    customer_name: "Jean Dupont",
    customer_phone: "06 12 34 56 78",
    customer_email: null,
    scheduled_at: null,
    estimated_ready_at: null,
    notes: "Sans oignons svp",
    loyalty_points_earned: 13,
    loyalty_reward_id: null,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    order_items: [
      { id: "oi-1", order_id: "ord-1", menu_item_id: "1", variant_id: "v2", quantity: 1, unit_price: 1340, extras_price: 0, item_name: "Le Classic Smash", variant_name: "Menu", extras_json: null, special_instructions: "Sans oignons" },
    ],
  },
  {
    id: "ord-2",
    order_number: 43,
    user_id: null,
    order_type: "delivery",
    status: "preparing",
    payment_status: "succeeded",
    stripe_payment_intent_id: null,
    subtotal: 2180,
    delivery_fee: 350,
    discount_amount: 0,
    total: 2530,
    customer_name: "Marie Martin",
    customer_phone: "06 98 76 54 32",
    customer_email: null,
    scheduled_at: null,
    estimated_ready_at: null,
    notes: null,
    loyalty_points_earned: 25,
    loyalty_reward_id: null,
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    order_items: [
      { id: "oi-2", order_id: "ord-2", menu_item_id: "2", variant_id: null, quantity: 2, unit_price: 890, extras_price: 200, item_name: "Tacos XL", variant_name: null, extras_json: [{ name: "Cheddar supp.", price: 100 }, { name: "Bacon", price: 100 }], special_instructions: null },
      { id: "oi-3", order_id: "ord-2", menu_item_id: "8", variant_id: null, quantity: 1, unit_price: 350, extras_price: 0, item_name: "Frites Maison", variant_name: null, extras_json: null, special_instructions: null },
    ],
  },
  {
    id: "ord-3",
    order_number: 44,
    user_id: null,
    order_type: "collect",
    status: "ready",
    payment_status: "succeeded",
    stripe_payment_intent_id: null,
    subtotal: 850,
    delivery_fee: 0,
    discount_amount: 0,
    total: 850,
    customer_name: "Pierre Durand",
    customer_phone: "06 11 22 33 44",
    customer_email: null,
    scheduled_at: null,
    estimated_ready_at: null,
    notes: null,
    loyalty_points_earned: 8,
    loyalty_reward_id: null,
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    order_items: [
      { id: "oi-4", order_id: "ord-3", menu_item_id: "6", variant_id: null, quantity: 1, unit_price: 850, extras_price: 0, item_name: "Wrap Chicken Avocado", variant_name: null, extras_json: null, special_instructions: null },
    ],
  },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "picked_up", // or "out_for_delivery" for delivery orders
};

const STATUS_COLUMNS: { key: string; label: string; statuses: OrderStatus[]; icon: React.ElementType }[] = [
  { key: "new", label: "Nouvelles", statuses: ["paid", "accepted"], icon: Package },
  { key: "prep", label: "En preparation", statuses: ["preparing"], icon: ChefHat },
  { key: "ready", label: "Pret", statuses: ["ready", "out_for_delivery"], icon: Check },
];

function getMinutesAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<OrderWithItems[]>(DEMO_ORDERS);
  const { play: playNotification, enabled: soundEnabled, setEnabled: setSoundEnabled } = useSound("/sounds/new-order.mp3");
  const [now, setNow] = useState(Date.now());

  // Update timer every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const advanceStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        let next = NEXT_STATUS[o.status];
        if (o.status === "ready" && o.order_type === "delivery") {
          next = "out_for_delivery";
        }
        if (!next) return o;
        return { ...o, status: next };
      }).filter((o) => !["picked_up", "delivered"].includes(o.status))
    );
  };

  const todayOrderCount = orders.length + 15; // demo offset
  const todayRevenue = orders.reduce((s, o) => s + o.total, 0) + 15600; // demo offset

  return (
    <div className="h-dvh flex flex-col">
      {/* Kitchen header */}
      <header className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-purple flex items-center justify-center text-white font-bold text-sm">
              SS
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Cuisine</h1>
              <p className="text-xs text-white/50">SOUTH STREET FOOD</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white tabular-nums">
                {todayOrderCount}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">
                Commandes
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-green tabular-nums">
                {formatPrice(todayRevenue)}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">
                Revenue
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/kitchen/menu">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <UtensilsCrossed className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/kitchen/history">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <List className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              {soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>
            <div className="text-sm font-mono text-white/40 ml-2">
              {new Date(now).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-3 divide-x divide-white/10">
          {STATUS_COLUMNS.map((col) => {
            const colOrders = orders.filter((o) =>
              col.statuses.includes(o.status)
            );
            return (
              <div key={col.key} className="flex flex-col h-full">
                {/* Column header */}
                <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <col.icon className="h-4 w-4 text-white/40" />
                    <span className="font-semibold text-sm text-white/70">
                      {col.label}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white/60"
                  >
                    {colOrders.length}
                  </Badge>
                </div>

                {/* Orders */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {colOrders.map((order) => {
                    const minutesAgo = getMinutesAgo(order.created_at);
                    const isUrgent = minutesAgo > 15 && order.status !== "ready";
                    const nextStatus = order.status === "ready" && order.order_type === "delivery"
                      ? "out_for_delivery"
                      : NEXT_STATUS[order.status];

                    return (
                      <div
                        key={order.id}
                        className={cn(
                          "rounded-2xl border p-4 transition-all",
                          isUrgent
                            ? "border-brand-pink/50 bg-brand-pink/5"
                            : "border-white/10 bg-white/5",
                          "hover:bg-white/8"
                        )}
                      >
                        {/* Order header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white">
                                #{String(order.order_number).padStart(4, "0")}
                              </span>
                              <Badge
                                className={cn(
                                  "text-[10px]",
                                  order.order_type === "delivery"
                                    ? "bg-brand-pink/20 text-brand-pink"
                                    : "bg-brand-green/20 text-brand-green"
                                )}
                              >
                                {order.order_type === "delivery" ? (
                                  <><Truck className="h-3 w-3 mr-1" />Livraison</>
                                ) : (
                                  "A emporter"
                                )}
                              </Badge>
                            </div>
                            <p className="text-xs text-white/40 mt-0.5">
                              {order.customer_name}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs tabular-nums",
                              isUrgent
                                ? "text-brand-pink"
                                : "text-white/30"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {minutesAgo}min
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5 mb-3">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between"
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-bold text-brand-yellow bg-brand-yellow/10 rounded px-1.5 py-0.5 tabular-nums">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <span className="text-sm font-medium text-white">
                                    {item.item_name}
                                  </span>
                                  {item.variant_name && (
                                    <span className="text-xs text-white/40 ml-1">
                                      ({item.variant_name})
                                    </span>
                                  )}
                                  {item.special_instructions && (
                                    <p className="text-xs text-brand-yellow mt-0.5">
                                      ⚠ {item.special_instructions}
                                    </p>
                                  )}
                                  {item.extras_json && Array.isArray(item.extras_json) && (
                                    <p className="text-xs text-white/30 mt-0.5">
                                      + {(item.extras_json as Array<{ name: string }>).map((e) => e.name).join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="mb-3 text-xs text-brand-yellow bg-brand-yellow/10 rounded-lg px-3 py-2">
                            {order.notes}
                          </div>
                        )}

                        {/* Action button */}
                        {nextStatus && (
                          <Button
                            onClick={() => advanceStatus(order.id)}
                            size="sm"
                            className={cn(
                              "w-full mt-1",
                              order.status === "paid" && "bg-brand-purple hover:bg-brand-purple-light",
                              order.status === "accepted" && "bg-brand-purple hover:bg-brand-purple-light",
                              order.status === "preparing" && "bg-brand-yellow text-black hover:bg-brand-yellow/80",
                              order.status === "ready" && "bg-brand-green hover:bg-brand-green/80"
                            )}
                          >
                            {order.status === "paid" && "Accepter"}
                            {order.status === "accepted" && "En preparation"}
                            {order.status === "preparing" && "Pret !"}
                            {order.status === "ready" &&
                              (order.order_type === "delivery"
                                ? "En livraison"
                                : "Recupere")}
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {colOrders.length === 0 && (
                    <div className="text-center py-10 text-white/20">
                      <col.icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucune commande</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
