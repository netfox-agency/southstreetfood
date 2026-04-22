import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Lock, Sparkles } from "lucide-react";
import { LOYALTY } from "@/lib/constants";
import type { LoyaltyCatalogItem } from "@/app/api/loyalty/catalog/route";

interface Props {
  catalog: LoyaltyCatalogItem[];
}

/**
 * Landing fidelite pour les non-connectes.
 *
 * Meme grammaire visuelle que l'etat connecte : hero noir avec progress
 * path (tous lockes), tiers groupes avec lock/unlock, combo menu en
 * featured. On pousse l'inscription avec la promesse +50 pts bienvenue.
 */
export function FideliteGuest({ catalog }: Props) {
  const tiers = groupByTier(catalog);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-5 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 mt-6">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0a0a0a] text-white">
          <div
            aria-hidden
            className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#e8416f]/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[#e8416f]/10 blur-3xl"
          />
          <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-[#e8416f]" />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#e8416f]">
                South Street Rewards
              </span>
            </div>

            <h1 className="font-display text-6xl sm:text-8xl leading-[0.9] tracking-tight mb-5">
              1 euro<br />= 1 point.
            </h1>
            <p className="text-[14px] sm:text-base text-white/70 max-w-lg leading-relaxed">
              Chaque commande compte. Cumule tes points, debloque des
              paliers, echange contre tes plats preferes.{" "}
              <span className="text-white font-semibold">
                {LOYALTY.welcomeBonus} points offerts
              </span>{" "}
              a la creation du compte.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup?redirect=/fidelite"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white text-[#0a0a0a] font-semibold text-[15px] hover:bg-white/90 transition-colors"
              >
                Creer mon compte
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login?redirect=/fidelite"
                className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-white/20 text-white font-semibold text-[15px] hover:bg-white/10 transition-colors"
              >
                J&apos;ai deja un compte
              </Link>
            </div>

            {/* Preview path (tous lockes, teaser) */}
            <div className="mt-10">
              <GuestProgressPath tiers={tiers} />
            </div>
          </div>
        </div>
      </section>

      {/* 3 steps */}
      <section className="mx-auto max-w-5xl px-5 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Step
            num="01"
            title="Tu commandes"
            body="Comme d'habitude, depuis ton compte. Aucune carte, aucun code."
          />
          <Step
            num="02"
            title="Tu cumules"
            body="1 euro depense = 1 point ajoute au solde apres livraison."
          />
          <Step
            num="03"
            title="Tu te fais plaisir"
            body="Des 100 pts, echange contre frites, boisson, dessert ou burger."
          />
        </div>
      </section>

      {/* Tiers preview */}
      <section className="mx-auto max-w-5xl px-5 mt-14 mb-10">
        <h2 className="text-[22px] sm:text-[26px] font-bold text-[#1d1d1f] tracking-tight">
          Les paliers
        </h2>
        <p className="text-sm text-[#86868b] mt-1 mb-8">
          Plus tu commandes, plus tu montes.
        </p>

        <div className="space-y-10 sm:space-y-12">
          {tiers.map((tier) => (
            <GuestTierSection key={tier.pointsCost} tier={tier} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="rounded-2xl bg-[#0a0a0a] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:justify-between">
          <div>
            <p className="text-[15px] sm:text-base font-semibold">
              Pret a cumuler ?
            </p>
            <p className="text-[12px] sm:text-sm text-white/60 mt-0.5">
              {LOYALTY.welcomeBonus} points offerts a l&apos;inscription.
            </p>
          </div>
          <Link
            href="/auth/signup?redirect=/fidelite"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#e8416f] text-white font-semibold text-sm hover:bg-[#d13a63] transition-colors whitespace-nowrap"
          >
            Creer mon compte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function GuestProgressPath({ tiers }: { tiers: Tier[] }) {
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-[10px] h-[3px] bg-white/10 rounded-full" />
      <div className="relative flex justify-between">
        {tiers.map((tier) => (
          <div
            key={tier.pointsCost}
            className="flex flex-col items-center"
            style={{ width: `${100 / tiers.length}%` }}
          >
            <div className="h-[22px] w-[22px] rounded-full flex items-center justify-center border-2 bg-[#0a0a0a] border-white/30">
              <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </div>
            <span className="font-display text-[15px] mt-2 tabular-nums text-white/40">
              {tier.pointsCost}
            </span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5 hidden sm:block">
              {tier.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f5f5f7] p-5 sm:p-6">
      <span className="font-display text-3xl text-[#e8416f] tabular-nums">
        {num}
      </span>
      <h3 className="mt-2 font-semibold text-[15px] text-[#1d1d1f]">{title}</h3>
      <p className="mt-1 text-[13px] text-[#86868b] leading-relaxed">{body}</p>
    </div>
  );
}

function GuestTierSection({ tier }: { tier: Tier }) {
  const isCombo = tier.rewards.some((r) => r.rewardType === "combo_menu");

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5 bg-[#f5f5f7] text-[#86868b]">
          <Lock className="h-3 w-3" />
          <span className="font-display text-[15px] tabular-nums leading-none">
            {tier.pointsCost}
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase opacity-70">
            pts
          </span>
        </div>
        <div className="flex-1 h-px bg-[#e5e5ea]" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
          {tier.label}
        </span>
      </div>

      {isCombo ? (
        <div className="relative overflow-hidden rounded-3xl border border-[#e5e5ea]">
          <div className="bg-[#f5f5f7] flex flex-col sm:flex-row items-stretch">
            <div className="relative w-full sm:w-1/2 aspect-[16/10] sm:aspect-auto sm:min-h-[240px]">
              {tier.rewards[0].imageUrl && (
                <Image
                  src={tier.rewards[0].imageUrl}
                  alt={tier.rewards[0].name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-contain p-6 sm:p-10 grayscale opacity-70"
                />
              )}
            </div>
            <div className="p-6 sm:p-10 flex-1 flex flex-col justify-center">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#aeaeb2] mb-2">
                Le gros lot
              </span>
              <h3 className="font-display text-4xl sm:text-5xl text-[#1d1d1f] leading-none tracking-tight mb-2">
                {tier.rewards[0].name}
              </h3>
              <p className="text-[13px] sm:text-sm text-[#86868b] max-w-md">
                {tier.rewards[0].description ??
                  "Un menu complet offert quand tu atteins le dernier palier."}
              </p>
              <div className="mt-5">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 bg-white text-[#1d1d1f] border border-[#e5e5ea] font-display text-[15px] tabular-nums">
                  {tier.rewards[0].pointsCost} PTS
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {tier.rewards.map((r) => (
            <GuestRewardCard key={r.id} reward={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function GuestRewardCard({ reward }: { reward: LoyaltyCatalogItem }) {
  return (
    <div className="relative rounded-2xl bg-white border border-[#e5e5ea] overflow-hidden aspect-[4/5] flex flex-col">
      <div className="relative flex-1 bg-gradient-to-b from-white to-[#f0f0f2]">
        {reward.imageUrl ? (
          <Image
            src={reward.imageUrl}
            alt={reward.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-contain p-5 sm:p-7 grayscale opacity-80"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#c7c7cc] text-xs">
            Photo a venir
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 border-t border-[#e5e5ea]">
        <p className="text-[13px] sm:text-sm font-semibold text-[#1d1d1f] leading-tight truncate">
          {reward.name}
        </p>
        {reward.menuItemPrice !== null && (
          <p className="text-[11px] text-[#86868b] mt-0.5 tabular-nums">
            ~{(reward.menuItemPrice / 100).toFixed(2).replace(".", ",")} &euro;
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────── helpers ───────── */

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

