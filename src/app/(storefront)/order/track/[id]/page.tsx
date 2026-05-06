"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Circle, ArrowLeft, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";

function getSteps(orderType: string) {
  const base = [
    {
      status: "paid" as OrderStatus,
      label: "Commande recue",
      desc: "Le restaurant a recu votre commande",
    },
    {
      status: "preparing" as OrderStatus,
      label: "En preparation",
      desc: "Votre commande est en cuisine",
    },
  ];

  if (orderType === "delivery") {
    base.push({
      status: "ready" as OrderStatus,
      label: "Prete !",
      desc: "Votre commande va bientot partir",
    });
  } else if (orderType === "dine_in") {
    base.push({
      status: "ready" as OrderStatus,
      label: "Prete !",
      desc: "Votre commande arrive a votre table",
    });
  } else {
    base.push({
      status: "ready" as OrderStatus,
      label: "Prete !",
      desc: "Vous pouvez la recuperer au restaurant",
    });
  }

  return base;
}

const TERMINAL_STATUSES: OrderStatus[] = [
  "picked_up",
  "delivered",
  "out_for_delivery",
  "cancelled",
];

// Poll every 5s for active orders, 30s for terminal ones (rare but keeps the
// browser from hammering the API if the tab is left open).
const ACTIVE_POLL_MS = 5_000;
const TERMINAL_POLL_MS = 30_000;

type TrackedOrder = {
  id: string;
  order_number: number;
  order_type: "collect" | "delivery" | "dine_in";
  status: OrderStatus;
  created_at: string;
  estimated_ready_at: string | null;
};

export default function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // We read the current status inside the polling loop via this ref so the
  // interval can adapt its cadence without tearing down the effect on
  // every state change.
  const statusRef = useRef<OrderStatus | null>(null);
  statusRef.current = order?.status ?? null;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function fetchOnce() {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const res = await fetch(`/api/orders/${id}/track`, {
          signal: ac.signal,
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        if (!res.ok) return;
        const json = (await res.json()) as { order: TrackedOrder };
        if (!cancelled) {
          setOrder(json.order);
          setLoading(false);
        }
      } catch {
        // swallow abort / network errors; next tick will retry
      } finally {
        if (!cancelled) {
          const interval =
            statusRef.current &&
            TERMINAL_STATUSES.includes(statusRef.current)
              ? TERMINAL_POLL_MS
              : ACTIVE_POLL_MS;
          timer = setTimeout(fetchOnce, interval);
        }
      }
    }

    fetchOnce();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#fafafa] overflow-hidden">
        <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#e8416f]/10 blur-[120px] pointer-events-none" />
        <div className="relative max-w-lg mx-auto px-5 py-8 space-y-6">
          <div className="h-4 w-24 bg-black/5 rounded animate-pulse" />
          <div className="text-center space-y-3 mt-6">
            <div className="h-12 w-32 bg-black/5 rounded mx-auto animate-pulse" />
            <div className="h-7 w-20 bg-black/5 rounded-full mx-auto animate-pulse" />
          </div>
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/70 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="relative min-h-screen bg-[#fafafa] overflow-hidden flex items-center justify-center">
        <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#e8416f]/10 blur-[120px] pointer-events-none" />
        <div className="relative text-center px-5">
          <div className="text-6xl mb-4">🤷</div>
          <p className="text-lg font-bold text-foreground mb-2">Commande introuvable</p>
          <p className="text-sm text-muted-foreground mb-6">Vérifiez le lien ou contactez le restaurant</p>
          <Link
            href="/menu"
            className="inline-flex items-center px-5 h-10 rounded-full bg-[#e8416f] text-white text-sm font-semibold hover:bg-[#d63862] transition-colors active:scale-[0.97]"
          >
            Retour au menu
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = order.status;
  const orderNumber = order.order_number;
  const steps = getSteps(order.order_type);
  const currentIdx = steps.findIndex((s) => s.status === currentStatus);
  const isDone = TERMINAL_STATUSES.includes(currentStatus);

  return (
    <div className="relative min-h-screen bg-[#fafafa] overflow-hidden">
      <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#e8416f]/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#e8416f]/8 blur-[120px] pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-5 py-8">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Menu
        </Link>

        <div className="text-center mb-10">
          <h1 className="font-display text-5xl text-foreground tracking-tight leading-[0.95]">
            Suivi.
          </h1>
          <p className="inline-flex items-center mt-3 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)] text-[#e8416f] font-bold text-sm tabular-nums">
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
                : currentStatus === "cancelled"
                ? "Commande annulee"
                : "Commande terminee"}
            </h2>
            <p className="text-muted-foreground">
              {currentStatus === "out_for_delivery"
                ? "Votre livreur est en route"
                : currentStatus === "cancelled"
                ? "Contactez le restaurant pour plus d'infos"
                : "Merci pour votre commande !"}
            </p>
          </div>
        ) : (
          <div className="space-y-0 mb-10">
            {steps.map((step, i) => {
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
                        className="relative h-7 w-7 rounded-full bg-[#e8416f] flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(232,65,111,0.5)]"
                      >
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#e8416f] opacity-60 animate-ping" />
                        <div className="relative h-2.5 w-2.5 rounded-full bg-white" />
                      </motion.div>
                    ) : (
                      <Circle className="h-7 w-7 text-border" />
                    )}
                    {i < steps.length - 1 && (
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

        <div className="p-6 rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.12)] text-center">
          <p className="text-sm text-muted-foreground mb-3">Un problème ?</p>
          <a
            href="tel:"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-[#0a0a0a] text-white text-sm font-semibold hover:bg-[#1d1d1f] transition-colors active:scale-[0.97]"
          >
            <Phone className="h-4 w-4" />
            Appeler le restaurant
          </a>
        </div>
      </div>
    </div>
  );
}
