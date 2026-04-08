"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Circle, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

const TRACKING_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: "paid", label: "Commande recue", description: "Votre commande a ete recue et payee" },
  { status: "accepted", label: "Acceptee", description: "Le restaurant a accepte votre commande" },
  { status: "preparing", label: "En preparation", description: "Votre commande est en cours de preparation" },
  { status: "ready", label: "Prete", description: "Votre commande est prete !" },
];

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [currentStatus] = useState<OrderStatus>("preparing"); // Will use Realtime

  const currentStepIndex = TRACKING_STEPS.findIndex(
    (s) => s.status === currentStatus
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au menu
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Suivi commande
          </h1>
          <p className="mt-1 text-lg text-brand-purple font-semibold">
            #0042
          </p>
        </div>

        {/* Status timeline */}
        <div className="space-y-0 mb-10">
          {TRACKING_STEPS.map((step, i) => {
            const isComplete = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isPending = i > currentStepIndex;

            return (
              <div key={step.status} className="flex gap-4">
                {/* Line + circle */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={isCurrent ? { scale: 0 } : undefined}
                    animate={isCurrent ? { scale: 1 } : undefined}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-8 w-8 text-brand-green" />
                    ) : isCurrent ? (
                      <div className="h-8 w-8 rounded-full bg-brand-purple flex items-center justify-center animate-pulse-glow">
                        <div className="h-3 w-3 rounded-full bg-white" />
                      </div>
                    ) : (
                      <Circle className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </motion.div>
                  {i < TRACKING_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 h-16",
                        isComplete
                          ? "bg-brand-green"
                          : "bg-muted-foreground/15"
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="pt-1 pb-8">
                  <h3
                    className={cn(
                      "font-semibold",
                      isCurrent
                        ? "text-foreground"
                        : isComplete
                        ? "text-brand-green"
                        : "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </h3>
                  <p
                    className={cn(
                      "text-sm mt-0.5",
                      isPending
                        ? "text-muted-foreground/30"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="glass-card p-5 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Un probleme avec votre commande ?
          </p>
          <Button variant="outline" size="sm" className="gap-2">
            <Phone className="h-4 w-4" />
            Appeler le restaurant
          </Button>
        </div>
      </div>
    </div>
  );
}
