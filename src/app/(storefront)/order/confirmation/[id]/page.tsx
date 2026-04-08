"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="mb-6"
        >
          <CheckCircle className="h-20 w-20 text-brand-green mx-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-foreground mb-2">
            Commande confirmee !
          </h1>
          <p className="text-muted-foreground mb-6">
            Votre commande a ete envoyee en cuisine
          </p>

          <div className="glass-card p-6 mb-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                <span className="text-brand-purple font-bold text-sm">
                  #0042
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Commande #0042
                </p>
                <p className="text-xs text-muted-foreground">
                  En cours de preparation
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-brand-yellow" />
              <span className="text-muted-foreground">
                Temps estime : <strong className="text-foreground">20 min</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-brand-green" />
              <span className="text-muted-foreground">
                A emporter au restaurant
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href={`/order/track/${id}`}>
              <Button className="w-full" size="lg">
                Suivre ma commande
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/menu">
              <Button variant="outline" className="w-full" size="lg">
                Retour au menu
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
