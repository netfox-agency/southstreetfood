"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Circle, ArrowLeft, Phone, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";

const STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: "paid", label: "Commande recue", desc: "Le restaurant a recu votre commande" },
  { status: "preparing", label: "En preparation", desc: "Votre commande est en cuisine" },
  { status: "ready", label: "Prete !", desc: "Vous pouvez la recuperer" },
];

export default function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .single();

      setOrder(data);
      setLoading(false);
    }
    load();
  }, [id]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`track-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : payload.new));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold mb-2">Commande introuvable</p>
          <Link href="/menu" className="text-brand text-sm">
            Retour au menu
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = order.status as OrderStatus;
  const orderNumber = order.order_number as number;
  const currentIdx = STEPS.findIndex((s) => s.status === currentStatus);
  const isDone = ["picked_up", "delivered", "out_for_delivery"].includes(currentStatus);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-5 py-8">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Menu
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-foreground">
            Suivi commande
          </h1>
          <p className="text-brand font-bold text-lg mt-1">
            #{String(orderNumber).padStart(4, "0")}
          </p>
        </div>

        {isDone ? (
          <div className="text-center py-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <CheckCircle className="h-20 w-20 text-emerald-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {currentStatus === "out_for_delivery"
                ? "En cours de livraison"
                : "Commande terminee"}
            </h2>
            <p className="text-muted-foreground">
              {currentStatus === "out_for_delivery"
                ? "Votre livreur est en route"
                : "Merci pour votre commande !"}
            </p>
          </div>
        ) : (
          <div className="space-y-0 mb-10">
            {STEPS.map((step, i) => {
              const isComplete = i < currentIdx;
              const isCurrent = i === currentIdx;

              return (
                <div key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {isComplete ? (
                      <CheckCircle className="h-7 w-7 text-emerald-500" />
                    ) : isCurrent ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-7 w-7 rounded-full bg-brand flex items-center justify-center"
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                      </motion.div>
                    ) : (
                      <Circle className="h-7 w-7 text-border" />
                    )}
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 h-14",
                          isComplete ? "bg-emerald-500" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                  <div className="pt-0.5 pb-6">
                    <h3
                      className={cn(
                        "font-semibold text-sm",
                        isCurrent
                          ? "text-foreground"
                          : isComplete
                          ? "text-emerald-600"
                          : "text-muted-foreground/40"
                      )}
                    >
                      {step.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="card-premium p-5 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Un probleme ?
          </p>
          <a
            href="tel:"
            className="btn-outline inline-flex items-center gap-2 !py-2.5 !px-5 text-sm"
          >
            <Phone className="h-4 w-4" />
            Appeler le restaurant
          </a>
        </div>
      </div>
    </div>
  );
}
