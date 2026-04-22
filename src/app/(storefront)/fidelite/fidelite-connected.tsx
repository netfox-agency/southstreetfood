"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";
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
 * Etat connecte — design gamifie tier-by-tier.
 *
 * Hero noir : brand kicker + balance Pricedown huge + progress path
 * horizontal avec 4 milestones (100 / 150 / 175 / 200). Current pos
 * materialisee par un dot brand rose qui avance sur la ligne.
 *
 * Sous le hero : sections groupees par tier. Chaque section a un
 * header avec lock/unlock state et un compteur "X / Y debloques".
 * Le dernier tier (Menu complet) est mis en avant (featured card).
 */
export function FideliteConnected({
  points,
  firstName,
  catalog,
  transactions,
}: Props) {
  /* ───────── Group by tier ───────── */
  const tiers = useMemo(() => groupByTier(catalog), [catalog]);

  /* ───────── Progress path (hero) ───────── */
  const path = useMemo(() => buildPath(tiers, points), [tiers, points]);

  const nextTier = tiers.find((t) => t.pointsCost > points) ?? null;
  const nextTierPts = nextTier ? nextTier.pointsCost - points : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Back */}
      <div className="mx-auto max-w-5xl px-5 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      {/* ═════════ HERO ═════════ */}
      <section className="mx-auto max-w-5xl px-5 mt-6">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0a0a0a] text-white">
          {/* Brand accent glow */}
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

            {/* Balance */}
            <div className="flex items-end gap-3 flex-wrap">
              <span className="font-display text-[88px] sm:text-[128px] leading-[0.85] tabular-nums">
                {points}
              </span>
              <span className="text-base sm:text-lg font-semibold text-white/60 mb-2 sm:mb-4">
                points
              </span>
            </div>
            <p className="mt-3 text-[13px] sm:text-sm text-white/60">
              Salut {firstName}. 1 euro = 1 point.
            </p>

            {/* Progress path gamifie */}
            <div className="mt-8 sm:mt-10">
              <ProgressPath path={path} />
            </div>

            {/* Caption under path */}
            <div className="mt-5 flex items-center gap-2">
              {nextTier ? (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-[#e8416f] animate-pulse" />
                  <p className="text-[12px] sm:text-[13px] text-white/70">
                    Encore{" "}
                    <span className="font-bold text-white tabular-nums">
                      {nextTierPts} pts
                    </span>{" "}
                    pour debloquer le palier{" "}
                    <span className="font-semibold text-white">
                      {nextTier.pointsCost} pts
                    </span>
                  </p>
                </>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">
                  <Check className="h-3 w-3 text-[#e8416f]" />
                  Tous les paliers sont debloques. Go chercher ton menu.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════ TIERS ═════════ */}
      <section className="mx-auto max-w-5xl px-5 mt-10 sm:mt-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-[22px] sm:text-[26px] font-bold text-[#1d1d1f] tracking-tight">
              Mes recompenses
            </h2>
            <p className="text-sm text-[#86868b] mt-1">
              Selectionne ta recompense dans le panier au moment de commander.
            </p>
          </div>
        </div>

        <div className="space-y-10 sm:space-y-12">
          {tiers.map((tier) => (
            <TierSection key={tier.pointsCost} tier={tier} balance={points} />
          ))}
        </div>
      </section>

      {/* ═════════ HISTORIQUE ═════════ */}
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
              className="inline-flex items-center justify-center gap-1.5 mt-4 h-10 px-5 rounded-full bg-[#0a0a0a] text-white text-[13px] font-semibold hover:bg-[#1d1d1f] transition-colors"
            >
              Voir la carte
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e5ea] rounded-2xl bg-white border border-[#e5e5ea] overflow-hidden">
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
                    <p className="text-[14px] font-medium text-[#1d1d1f] truncate">
                      {t.description ||
                        (isEarn ? "Points gagnes" : "Points utilises")}
                    </p>
                    <p className="text-[12px] text-[#86868b]">
                      {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`tabular-nums text-[14px] font-bold ${
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

/* ──────────────── Progress Path ──────────────── */

interface PathNode {
  pointsCost: number;
  reached: boolean;
  isCurrent: boolean;
  rewardLabel: string;
}

function buildPath(
  tiers: Tier[],
  balance: number,
): { nodes: PathNode[]; fillPct: number } {
  const nodes: PathNode[] = tiers.map((t) => ({
    pointsCost: t.pointsCost,
    reached: balance >= t.pointsCost,
    isCurrent: false,
    rewardLabel: t.label,
  }));

  // Calcul du fill (0-100%) : position relative de balance sur l'echelle
  // de 0 au dernier milestone. Plafonne a 100%.
  const last = nodes[nodes.length - 1]?.pointsCost ?? 100;
  const fillPct = Math.max(0, Math.min(100, (balance / last) * 100));

  return { nodes, fillPct };
}

function ProgressPath({
  path,
}: {
  path: { nodes: PathNode[]; fillPct: number };
}) {
  return (
    <div className="relative">
      {/* Track line (base + fill) */}
      <div className="absolute left-0 right-0 top-[10px] h-[3px] bg-white/10 rounded-full" />
      <div
        className="absolute left-0 top-[10px] h-[3px] bg-[#e8416f] rounded-full transition-all duration-700"
        style={{ width: `${path.fillPct}%` }}
      />

      {/* Milestones */}
      <div className="relative flex justify-between">
        {path.nodes.map((node) => (
          <div
            key={node.pointsCost}
            className="flex flex-col items-center"
            style={{ width: `${100 / path.nodes.length}%` }}
          >
            <div
              className={`h-[22px] w-[22px] rounded-full flex items-center justify-center border-2 transition-all ${
                node.reached
                  ? "bg-[#e8416f] border-[#e8416f]"
                  : "bg-[#0a0a0a] border-white/30"
              }`}
            >
              {node.reached ? (
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
              )}
            </div>
            <span
              className={`font-display text-[15px] mt-2 tabular-nums ${
                node.reached ? "text-white" : "text-white/40"
              }`}
            >
              {node.pointsCost}
            </span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 hidden sm:block">
              {node.rewardLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────── Tier Section ──────────────── */

interface Tier {
  pointsCost: number;
  label: string;
  rewards: LoyaltyCatalogItem[];
}

function groupByTier(catalog: LoyaltyCatalogItem[]): Tier[] {
  const byCost = new Map<number, LoyaltyCatalogItem[]>();
  for (const r of catalog) {
    const arr = byCost.get(r.pointsCost) ?? [];
    arr.push(r);
    byCost.set(r.pointsCost, arr);
  }
  const sortedCosts = [...byCost.keys()].sort((a, b) => a - b);
  return sortedCosts.map((pointsCost) => {
    const rewards = byCost.get(pointsCost)!;
    return {
      pointsCost,
      label: tierLabelFor(pointsCost, rewards),
      rewards,
    };
  });
}

function tierLabelFor(cost: number, rewards: LoyaltyCatalogItem[]): string {
  if (rewards.some((r) => r.rewardType === "combo_menu")) return "Menu";
  if (cost >= 175) return "Premium";
  if (cost >= 150) return "Burger";
  return "Snack";
}

function TierSection({ tier, balance }: { tier: Tier; balance: number }) {
  const unlocked = balance >= tier.pointsCost;
  const ptsLeft = Math.max(0, tier.pointsCost - balance);
  const isCombo = tier.rewards.some((r) => r.rewardType === "combo_menu");

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 ${
            unlocked
              ? "bg-[#0a0a0a] text-white"
              : "bg-[#f5f5f7] text-[#86868b]"
          }`}
        >
          {unlocked ? (
            <Check className="h-3.5 w-3.5 text-[#e8416f]" strokeWidth={3} />
          ) : (
            <Lock className="h-3 w-3" />
          )}
          <span className="font-display text-[15px] tabular-nums leading-none">
            {tier.pointsCost}
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase opacity-70">
            pts
          </span>
        </div>
        <div className="flex-1 h-px bg-[#e5e5ea]" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
          {unlocked ? "Debloque" : `Encore ${ptsLeft} pts`}
        </span>
      </div>

      {/* Cards layout : combo = featured full-width, free_item = grid */}
      {isCombo ? (
        <ComboFeaturedCard reward={tier.rewards[0]} unlocked={unlocked} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {tier.rewards.map((r) => (
            <RewardCard key={r.id} reward={r} unlocked={unlocked} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────── Reward Cards ──────────────── */

function RewardCard({
  reward,
  unlocked,
}: {
  reward: LoyaltyCatalogItem;
  unlocked: boolean;
}) {
  return (
    <Link
      href="/menu"
      className={`group relative rounded-2xl overflow-hidden aspect-[4/5] flex flex-col border transition-all ${
        unlocked
          ? "border-[#e5e5ea] hover:border-[#0a0a0a]/30 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] bg-white"
          : "border-[#e5e5ea] bg-white"
      }`}
    >
      <div className="relative flex-1 bg-gradient-to-b from-white to-[#f0f0f2]">
        {reward.imageUrl ? (
          <Image
            src={reward.imageUrl}
            alt={reward.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className={`object-contain p-5 sm:p-7 transition-transform ${
              unlocked ? "group-hover:scale-[1.05]" : "grayscale opacity-80"
            }`}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#c7c7cc] text-xs">
            Photo a venir
          </div>
        )}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-[#0a0a0a]/80 backdrop-blur flex items-center justify-center">
              <Lock className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 border-t border-[#e5e5ea]">
        <p className="text-[13px] sm:text-sm font-semibold text-[#1d1d1f] leading-tight truncate">
          {reward.name}
        </p>
        <div className="flex items-center justify-between mt-1 gap-2">
          <span
            className={`text-[11px] ${unlocked ? "text-emerald-600 font-semibold" : "text-[#86868b]"}`}
          >
            {unlocked ? "Disponible" : "Bientot"}
          </span>
          {reward.menuItemPrice !== null && (
            <span className="text-[11px] text-[#86868b] tabular-nums">
              ~{(reward.menuItemPrice / 100).toFixed(2).replace(".", ",")}{" "}
              &euro;
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ComboFeaturedCard({
  reward,
  unlocked,
}: {
  reward: LoyaltyCatalogItem;
  unlocked: boolean;
}) {
  return (
    <Link
      href="/menu"
      className={`group block relative overflow-hidden rounded-3xl border transition-all ${
        unlocked
          ? "border-[#0a0a0a] hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)]"
          : "border-[#e5e5ea]"
      }`}
    >
      <div
        className={`relative flex flex-col sm:flex-row items-stretch ${
          unlocked ? "bg-[#0a0a0a] text-white" : "bg-[#f5f5f7] text-[#86868b]"
        }`}
      >
        {/* Image side */}
        <div className="relative w-full sm:w-1/2 aspect-[16/10] sm:aspect-auto sm:min-h-[280px] bg-gradient-to-br from-white/5 to-transparent">
          {reward.imageUrl && (
            <Image
              src={reward.imageUrl}
              alt={reward.name}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className={`object-contain p-6 sm:p-10 ${unlocked ? "" : "grayscale opacity-70"}`}
            />
          )}
          {/* Glow brand accent (seulement si unlocked) */}
          {unlocked && (
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#e8416f]/20 blur-3xl"
            />
          )}
        </div>

        {/* Content side */}
        <div className="relative p-6 sm:p-10 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[10px] font-bold tracking-[0.2em] uppercase ${
                unlocked ? "text-[#e8416f]" : "text-[#aeaeb2]"
              }`}
            >
              Le gros lot
            </span>
            {!unlocked && (
              <Lock className="h-3 w-3 text-[#aeaeb2]" />
            )}
          </div>
          <h3
            className={`font-display text-4xl sm:text-5xl leading-none tracking-tight mb-3 ${
              unlocked ? "text-white" : "text-[#1d1d1f]"
            }`}
          >
            {reward.name}
          </h3>
          <p
            className={`text-[13px] sm:text-sm max-w-md ${
              unlocked ? "text-white/70" : "text-[#86868b]"
            }`}
          >
            {reward.description ??
              "Un menu complet offert quand tu atteins le dernier palier."}
          </p>

          <div className="mt-5 inline-flex items-center gap-3">
            <div
              className={`rounded-full px-3.5 py-1.5 font-display text-[15px] tabular-nums ${
                unlocked
                  ? "bg-[#e8416f] text-white"
                  : "bg-white text-[#1d1d1f] border border-[#e5e5ea]"
              }`}
            >
              {reward.pointsCost} PTS
            </div>
            {unlocked ? (
              <span className="text-[12px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Disponible
              </span>
            ) : (
              <span className="text-[12px] text-[#86868b]">
                Le plus gros choix
              </span>
            )}
          </div>
        </div>
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
