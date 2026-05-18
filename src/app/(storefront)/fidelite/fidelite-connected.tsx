"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, Lock, Plus, Minus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { LoyaltyTier } from "@/app/api/loyalty/catalog/route";

interface Transaction {
  id: string;
  points: number;
  description: string;
  createdAt: string;
  orderId: string | null;
}

interface Props {
  points: number;
  firstName: string;
  catalog: LoyaltyTier[];
  transactions: Transaction[];
}

/**
 * Etat connecte — Loyalty v3.
 *
 * Hero noir avec balance Pricedown XXL + progress bar visuelle vers
 * le prochain palier. Sous le hero : grille des 6 paliers avec etat
 * (locked / available / unlocked). Section historique en bas.
 */
export function FideliteConnected({
  points,
  firstName,
  catalog,
  transactions,
}: Props) {
  const tiers = useMemo(
    () => [...catalog].sort((a, b) => a.tierLevel - b.tierLevel),
    [catalog],
  );

  const nextTier = tiers.find((t) => t.pointsCost > points) ?? null;
  const pointsToNext = nextTier ? nextTier.pointsCost - points : 0;
  const lastTier = tiers[tiers.length - 1];
  const progressPct = lastTier
    ? Math.min(100, Math.round((points / lastTier.pointsCost) * 100))
    : 0;

  return (
    <div className="relative min-h-screen bg-[#fafafa] overflow-hidden">
      <div className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-[#e8416f]/8 blur-[120px] pointer-events-none" />
      <div className="absolute top-[60vh] -left-32 h-[360px] w-[360px] rounded-full bg-[#e8416f]/8 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-5 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      {/* ═════════ HERO ═════════ */}
      <section className="relative mx-auto max-w-5xl px-5 mt-6">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0a0a0a] text-white">
          <div
            aria-hidden
            className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#e8416f]/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[#e8416f]/10 blur-3xl"
          />

          <div className="relative z-10 px-6 py-10 sm:px-12 sm:py-14">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-[#e8416f]" />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#e8416f]">
                South Street Rewards
              </span>
            </div>

            <div className="flex items-end gap-3 flex-wrap">
              <span className="font-display text-[88px] sm:text-[128px] leading-[0.85] tabular-nums">
                {points}
              </span>
              <span className="text-base sm:text-lg font-semibold text-white/60 mb-2 sm:mb-4">
                points
              </span>
            </div>
            <p className="mt-3 text-[13px] sm:text-sm text-white/60">
              Salut {firstName}. 1 euro depense = 1 point.
            </p>

            {/* Progress bar globale */}
            {lastTier && (
              <div className="mt-8 sm:mt-10">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-[#e8416f]"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {nextTier ? (
                    <>
                      <div className="h-1.5 w-1.5 rounded-full bg-[#e8416f] animate-pulse" />
                      <p className="text-[12px] sm:text-[13px] text-white/70">
                        Encore{" "}
                        <span className="font-bold text-white tabular-nums">
                          {pointsToNext} pts
                        </span>{" "}
                        pour debloquer le palier {nextTier.tierLevel} (
                        {nextTier.description})
                      </p>
                    </>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">
                      <Check className="h-3 w-3 text-[#e8416f]" />
                      Tous les paliers sont debloques.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═════════ LES 6 PALIERS ═════════ */}
      <section className="relative mx-auto max-w-5xl px-5 mt-10 sm:mt-14">
        <div className="mb-5">
          <h2 className="font-display text-3xl sm:text-4xl text-[#1d1d1f] tracking-tight">
            Mes paliers
          </h2>
          <p className="text-sm text-[#86868b] mt-1">
            Choisis ta recompense au moment de commander, dans le panier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tiers.map((tier) => {
            const isUnlocked = points >= tier.pointsCost;
            return <TierCard key={tier.id} tier={tier} unlocked={isUnlocked} />;
          })}
        </div>
      </section>

      {/* ═════════ HISTORIQUE ═════════ */}
      <section className="relative mx-auto max-w-5xl px-5 mt-12 mb-20">
        <h2 className="font-display text-2xl sm:text-3xl text-[#1d1d1f] tracking-tight mb-4">
          Historique
        </h2>
        {transactions.length === 0 ? (
          <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] p-6 sm:p-8 text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-[14px] text-[#1d1d1f] font-medium">
              Aucune transaction pour l&apos;instant.
            </p>
            <p className="text-[12px] text-[#86868b] mt-1">
              Passe ta premiere commande pour commencer a cumuler.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-1.5 mt-4 h-10 px-5 rounded-full bg-[#0a0a0a] text-white text-[13px] font-semibold hover:bg-[#1d1d1f] transition-colors"
            >
              Voir la carte
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e5ea] rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
            {transactions.map((t) => {
              const isEarn = t.points > 0;
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      isEarn ? "bg-emerald-50" : "bg-[#fde8ee]"
                    }`}
                  >
                    {isEarn ? (
                      <Plus className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-[#e8416f]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#1d1d1f] truncate">
                      {t.description || (isEarn ? "Points cumules" : "Points utilises")}
                    </p>
                    <p className="text-[11px] text-[#86868b]">
                      {new Date(t.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-[14px] font-bold tabular-nums shrink-0 ${
                      isEarn ? "text-emerald-600" : "text-[#e8416f]"
                    }`}
                  >
                    {isEarn ? "+" : ""}
                    {t.points}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function TierCard({
  tier,
  unlocked,
}: {
  tier: LoyaltyTier;
  unlocked: boolean;
}) {
  return (
    <motion.div
      whileHover={unlocked ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl border p-5 transition-all duration-300 ${
        unlocked
          ? "bg-white border-[#e8416f]/40 shadow-[0_12px_32px_-12px_rgba(232,65,111,0.35)]"
          : "bg-white/70 backdrop-blur-2xl border-[#e5e5ea]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            unlocked
              ? "bg-[#e8416f] text-white shadow-[0_4px_12px_-4px_rgba(232,65,111,0.5)]"
              : "bg-[#f5f5f7] text-[#c7c7cc]"
          }`}
        >
          <span className="font-bold text-base tabular-nums">
            {tier.tierLevel}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-[#1d1d1f] tabular-nums">
              {tier.pointsCost} pts
            </p>
            {unlocked ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fff5f8] border border-[#e8416f]/30 text-[10px] font-bold text-[#e8416f]">
                <Check className="h-2.5 w-2.5" />
                Dispo
              </span>
            ) : (
              <Lock className="h-3 w-3 text-[#aeaeb2]" />
            )}
          </div>
          <p className="text-[13px] text-[#1d1d1f] mt-0.5 leading-snug">
            {tier.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
