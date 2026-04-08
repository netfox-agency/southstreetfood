"use client";

import Link from "next/link";
import { ArrowLeft, Gift, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEMO_REWARDS = [
  { id: "r1", name: "Frites Maison offertes", points_cost: 100, icon: "🍟" },
  { id: "r2", name: "Boisson offerte", points_cost: 80, icon: "🥤" },
  { id: "r3", name: "-20% sur la commande", points_cost: 200, icon: "💰" },
  { id: "r4", name: "Burger offert", points_cost: 300, icon: "🍔" },
];

export default function LoyaltyPage() {
  const userPoints = 120;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Mon compte
        </Link>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
          Programme fidelite
        </h1>
        <p className="text-muted-foreground mb-8">
          Gagnez des points a chaque commande
        </p>

        {/* Points balance */}
        <div className="glass-card p-6 mb-8 text-center bg-gradient-to-br from-brand-purple to-brand-purple-light text-white">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-brand-yellow" />
          <div className="text-4xl font-extrabold tabular-nums mb-1">
            {userPoints}
          </div>
          <p className="text-white/70 text-sm">points disponibles</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
            <Star className="h-3 w-3" />
            10 points gagnes par euro depense
          </div>
        </div>

        {/* Rewards */}
        <h2 className="font-semibold text-foreground mb-4">
          Recompenses disponibles
        </h2>
        <div className="space-y-3">
          {DEMO_REWARDS.map((reward) => {
            const canRedeem = userPoints >= reward.points_cost;
            return (
              <Card
                key={reward.id}
                className={cn(
                  "p-4 flex items-center gap-4",
                  !canRedeem && "opacity-60"
                )}
              >
                <div className="text-3xl">{reward.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-foreground">
                    {reward.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Gift className="h-3 w-3 text-brand-purple" />
                    <span className="text-xs text-muted-foreground">
                      {reward.points_cost} points
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={canRedeem ? "default" : "outline"}
                  disabled={!canRedeem}
                >
                  {canRedeem ? "Echanger" : "Insuffisant"}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
