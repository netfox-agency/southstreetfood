"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Clock, MapPin, ArrowRight, Truck, Store } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { computeTva } from "@/lib/constants";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import type { OrderWithItems } from "@/types/order";

export function ConfirmationClient({ order }: { order: OrderWithItems }) {
  const { settings } = useRestaurantSettings();
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-5 overflow-hidden">
      {/* Halos brand + emerald — celebration */}
      <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#34c759]/12 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#e8416f]/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-md w-full text-center py-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative inline-block">
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl scale-150" />
            <CheckCircle className="relative h-20 w-20 text-emerald-500 mx-auto" strokeWidth={1.8} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-5xl sm:text-6xl text-foreground tracking-tight leading-[0.95] mb-3">
            Merci.
          </h1>
          <p className="text-muted-foreground mb-8 text-[15px]">
            Votre commande a ete envoyee en cuisine.
          </p>

          <div className="rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] p-6 mb-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#fff5f8] flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(232,65,111,0.3)]">
                <span className="text-[#e8416f] font-black text-sm tabular-nums">
                  #{String(order.order_number).padStart(4, "0")}
                </span>
              </div>
              <div>
                <p className="font-bold text-foreground">
                  Commande #{String(order.order_number).padStart(4, "0")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.order_items.length} article{order.order_items.length > 1 ? "s" : ""} · {formatPrice(order.total)}
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  dont TVA 5,5% : {formatPrice(computeTva(order.total).tva)}
                </p>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-muted-foreground">
                Temps estime :{" "}
                <strong className="text-foreground tabular-nums">~{settings.estimatedPrepMinutes} min</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              {order.order_type === "delivery" && (
                <>
                  <Truck className="h-4 w-4 text-[#e8416f] shrink-0" />
                  <span className="text-muted-foreground">
                    Livraison à votre adresse
                  </span>
                </>
              )}
              {order.order_type === "collect" && (
                <>
                  <Store className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-muted-foreground">
                    À récupérer au restaurant
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/order/track/${order.id}`}
              className="group inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#0a0a0a] text-white text-[14px] font-semibold shadow-[0_12px_32px_-8px_rgba(232,65,111,0.4)] hover:shadow-[0_16px_40px_-8px_rgba(232,65,111,0.5)] active:scale-[0.97] transition-all duration-300"
            >
              Suivre ma commande
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center h-12 rounded-full bg-white/70 backdrop-blur-2xl border border-white/60 text-foreground text-[14px] font-semibold hover:bg-white active:scale-[0.97] transition-all duration-300"
            >
              Retour au menu
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
