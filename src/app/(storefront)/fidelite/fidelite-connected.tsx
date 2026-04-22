"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { ArrowLeft, Check, Lock, Plus, Minus } from "lucide-react";
import type { LoyaltyCatalogItem } from "@/app/api/loyalty/catalog/route";

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
  catalog: LoyaltyCatalogItem[];
  transactions: Transaction[];
}

/**
 * Etat connecte. Hero noir + balance Pricedown, progress bar vers la
 * prochaine recompense atteignable, catalogue cliquable (redirige vers
 * /menu avec reward pre-selectionne dans le cart), historique des
 * transactions.
 *
 * Design: Apple + McDo+. Pas d'emoji. Pas de purple.
 */
export function FideliteConnected({
  points,
  firstName,
  catalog,
  transactions,
}: Props) {
  // Prochaine recompense : la premiere qu'on ne peut PAS encore offrir
  const nextReward = useMemo(
    () => catalog.find((r) => r.pointsCost > points) ?? null,
    [catalog, points],
  );

  // Progress bar : % vers la prochaine recompense (0-100)
  const progressPct = useMemo(() => {
    if (!nextReward) return 100;
    // On part du palier precedent pour que la barre avance de maniere lisible
    const prevTier =
      [...catalog]
        .reverse()
        .find((r) => r.pointsCost <= points)?.pointsCost ?? 0;
    const span = nextReward.pointsCost - prevTier;
    if (span <= 0) return 100;
    const progressInTier = points - prevTier;
    return Math.max(0, Math.min(100, (progressInTier / span) * 100));
  }, [catalog, nextReward, points]);

  const pointsToNext = nextReward ? nextReward.pointsCost - points : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="mx-auto max-w-5xl px-5 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      {/* Hero balance */}
      <section className="mx-auto max-w-5xl px-5 mt-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] text-white px-6 py-10 sm:px-12 sm:py-14">
          <div className="relative z-10">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#e8416f] mb-2">
              Mon solde
            </p>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-7xl sm:text-8xl leading-none tabular-nums">
                {points}
              </span>
              <span className="text-lg sm:text-xl font-semibold text-white/60">
                points
              </span>
            </div>
            <p className="mt-3 text-sm text-white/60">
              Salut {firstName}. 1 euro depense = 1 point.
            </p>

            {/* Progress */}
            {nextReward ? (
              <div className="mt-7 max-w-md">
                <div className="flex items-center justify-between text-[12px] mb-2">
                  <span className="text-white/70">
                    Prochaine recompense : {nextReward.name}
                  </span>
                  <span className="font-semibold text-white tabular-nums">
                    {pointsToNext} pts restants
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#e8416f] rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white">
                <Check className="h-3.5 w-3.5" />
                Tu peux debloquer toutes les recompenses.
              </div>
            )}
          </div>

          <div
            aria-hidden
            className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-[#e8416f]/10 blur-3xl"
          />
        </div>
      </section>

      {/* Catalogue */}
      <section className="mx-auto max-w-5xl px-5 mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-[22px] sm:text-[26px] font-bold text-[#1d1d1f] tracking-tight">
              Mes recompenses
            </h2>
            <p className="text-sm text-[#86868b] mt-1">
              Selectionne une recompense au moment du panier.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {catalog.map((r) => (
            <RewardCard key={r.id} reward={r} balance={points} />
          ))}
        </div>

        {/* Explainer */}
        <div className="mt-5 rounded-2xl bg-[#f5f5f7] p-4 sm:p-5 flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-white border border-[#e5e5ea] flex items-center justify-center shrink-0">
            <span className="font-display text-[15px] text-[#1d1d1f]">?</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#1d1d1f]">
              Comment utiliser mes points ?
            </p>
            <p className="text-[12px] text-[#86868b] mt-0.5 leading-relaxed">
              Ajoute tes articles au panier, puis choisis ta recompense
              avant de valider. Une seule recompense par commande. Les
              points ne sont debites qu&apos;apres livraison.
            </p>
          </div>
        </div>
      </section>

      {/* Historique */}
      <section className="mx-auto max-w-5xl px-5 mt-12 mb-20">
        <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1d1d1f] tracking-tight mb-4">
          Historique
        </h2>
        {transactions.length === 0 ? (
          <div className="rounded-2xl bg-[#f5f5f7] p-6 sm:p-8 text-center">
            <p className="text-[14px] text-[#1d1d1f] font-medium">
              Aucune transaction pour l&apos;instant.
            </p>
            <p className="text-[12px] text-[#86868b] mt-1">
              Passe ta premiere commande pour commencer a cumuler.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center mt-4 h-10 px-5 rounded-full bg-[#0a0a0a] text-white text-[13px] font-semibold hover:bg-[#1d1d1f] transition-colors"
            >
              Voir la carte
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e5ea] rounded-2xl bg-white border border-[#e5e5ea] overflow-hidden">
            {transactions.map((t) => {
              const isEarn = t.points > 0;
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      isEarn ? "bg-emerald-50" : "bg-[#f5f5f7]"
                    }`}
                  >
                    {isEarn ? (
                      <Plus className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-[#86868b]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#1d1d1f] truncate">
                      {t.description || (isEarn ? "Points gagnes" : "Points utilises")}
                    </p>
                    <p className="text-[12px] text-[#86868b]">
                      {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`tabular-nums text-[14px] font-semibold ${
                      isEarn ? "text-emerald-600" : "text-[#1d1d1f]"
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

/* ───────── Reward Card ───────── */

function RewardCard({
  reward,
  balance,
}: {
  reward: LoyaltyCatalogItem;
  balance: number;
}) {
  const canRedeem = balance >= reward.pointsCost;

  return (
    <Link
      href="/menu"
      className={`group relative rounded-2xl overflow-hidden aspect-[4/5] flex flex-col border transition-all ${
        canRedeem
          ? "border-[#e5e5ea] hover:border-[#0a0a0a]/20 hover:shadow-md bg-white"
          : "border-[#e5e5ea] bg-white opacity-70"
      }`}
    >
      <div className="relative flex-1 bg-gradient-to-b from-white to-[#f0f0f2]">
        {reward.imageUrl ? (
          <Image
            src={reward.imageUrl}
            alt={reward.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className={`object-contain p-4 sm:p-6 transition-transform ${
              canRedeem ? "group-hover:scale-[1.03]" : "grayscale"
            }`}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#c7c7cc] text-xs">
            Photo a venir
          </div>
        )}
        <div
          className={`absolute top-2.5 right-2.5 text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-full ${
            canRedeem
              ? "bg-[#0a0a0a] text-white"
              : "bg-white text-[#86868b] border border-[#e5e5ea]"
          }`}
        >
          {reward.pointsCost} pts
        </div>
        {!canRedeem && (
          <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[10px] font-semibold text-[#86868b] px-2 py-1 rounded-full border border-[#e5e5ea]">
            <Lock className="h-3 w-3" />
            {reward.pointsCost - balance} pts restants
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 border-t border-[#e5e5ea]">
        <p className="text-[13px] sm:text-sm font-semibold text-[#1d1d1f] leading-tight truncate">
          {reward.name}
        </p>
        {reward.menuItemPrice !== null && (
          <p className="text-[11px] text-[#86868b] mt-0.5">
            Valeur {(reward.menuItemPrice / 100).toFixed(2).replace(".", ",")}{" "}
            &euro;
          </p>
        )}
      </div>
    </Link>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
