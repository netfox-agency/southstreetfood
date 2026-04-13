"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Clock, MapPin, ArrowRight, Truck, Store } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import type { OrderWithItems } from "@/types/order";

export function ConfirmationClient({ order }: { order: OrderWithItems }) {
  const { settings } = useRestaurantSettings();
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-6"
        >
          <CheckCircle className="h-20 w-20 text-emerald-500 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-3xl font-black text-foreground mb-2">
            Commande confirmee !
          </h1>
          <p className="text-muted-foreground mb-8">
            Votre commande a ete envoyee en cuisine
          </p>

          <div className="card-premium p-6 mb-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center">
                <span className="text-brand font-black text-sm">
                  #{String(order.order_number).padStart(4, "0")}
                </span>
              </div>
              <div>
                <p className="font-bold text-foreground">
                  Commande #{String(order.order_number).padStart(4, "0")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.order_items.length} article{order.order_items.length > 1 ? "s" : ""} — {formatPrice(order.total)}
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">
                Temps estime :{" "}
                <strong className="text-foreground">~{settings.estimatedPrepMinutes} min</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              {order.order_type === "delivery" && (
                <>
                  <Truck className="h-4 w-4 text-brand" />
                  <span className="text-muted-foreground">
                    Livraison à votre adresse
                  </span>
                </>
              )}
              {order.order_type === "collect" && (
                <>
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground">
                    À récupérer au restaurant
                  </span>
                </>
              )}
              {order.order_type === "dine_in" && (
                <>
                  <Store className="h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground">
                    Servi sur place
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/order/track/${order.id}`}
              className="btn-primary justify-center w-full"
            >
              Suivre ma commande
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/menu"
              className="btn-outline justify-center w-full"
            >
              Retour au menu
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
