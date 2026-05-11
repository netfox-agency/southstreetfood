import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, Lock } from "lucide-react";
import type { LoyaltyTier } from "@/app/api/loyalty/catalog/route";

interface Props {
  catalog: LoyaltyTier[];
}

/**
 * Landing fidelite pour les non-connectes.
 *
 * Loyalty v3 : affiche les 6 paliers (tous lockes en guest).
 * Hero noir avec brand pink halos + CTAs auth. Pricedown sur la promesse
 * "1€ = 1 point".
 */
export function FideliteGuest({ catalog }: Props) {
  const tiers = [...catalog].sort((a, b) => a.tierLevel - b.tierLevel);

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

      {/* ── Hero ── */}
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
              Chaque commande compte. Cumule tes points, debloque 6 paliers,
              echange contre tes plats preferes. Cree ton compte pour
              commencer.
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
          </div>
        </div>
      </section>

      {/* ── 3 steps ── */}
      <section className="relative mx-auto max-w-5xl px-5 mt-12">
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
            body="Des 50 pts, echange contre boisson, dessert, sandwich ou menu complet."
          />
        </div>
      </section>

      {/* ── Les 6 paliers ── */}
      <section className="relative mx-auto max-w-5xl px-5 mt-14 mb-10">
        <h2 className="font-display text-3xl sm:text-4xl text-[#1d1d1f] tracking-tight">
          Les 6 paliers
        </h2>
        <p className="text-sm text-[#86868b] mt-1 mb-8">
          Plus tu cumules, plus tu debloques. Tes points sont a toi pour la
          vie, pas d&apos;expiration.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} locked />
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative mx-auto max-w-5xl px-5 pb-20">
        <div className="rounded-2xl bg-[#0a0a0a] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:justify-between">
          <div>
            <p className="text-[15px] sm:text-base font-semibold">
              Pret a cumuler ?
            </p>
            <p className="text-[12px] sm:text-sm text-white/60 mt-0.5">
              1 euro depense = 1 point. Premiere recompense des 50 pts.
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
    <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 p-5 sm:p-6 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_32px_-12px_rgba(232,65,111,0.2)] hover:-translate-y-0.5 transition-all duration-300">
      <span className="font-display text-3xl text-[#e8416f] tabular-nums">
        {num}
      </span>
      <h3 className="mt-2 font-semibold text-[15px] text-[#1d1d1f]">{title}</h3>
      <p className="mt-1 text-[13px] text-[#86868b] leading-relaxed">{body}</p>
    </div>
  );
}

function TierCard({
  tier,
  locked,
  available,
}: {
  tier: LoyaltyTier;
  locked?: boolean;
  available?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-5 transition-all duration-300 ${
        available
          ? "bg-white border-[#e8416f]/40 shadow-[0_12px_32px_-12px_rgba(232,65,111,0.35)]"
          : locked
            ? "bg-white/60 backdrop-blur-2xl border-[#e5e5ea] opacity-90"
            : "bg-white border-[#e5e5ea]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
            available
              ? "bg-[#e8416f] text-white shadow-[0_4px_12px_-4px_rgba(232,65,111,0.5)]"
              : "bg-[#f5f5f7] text-[#c7c7cc]"
          }`}
        >
          <span className="font-display text-lg tabular-nums">
            {tier.tierLevel}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-[#1d1d1f] tabular-nums">
              {tier.pointsCost} pts
            </p>
            {locked && <Lock className="h-3 w-3 text-[#aeaeb2]" />}
          </div>
          <p className="text-[13px] text-[#1d1d1f] mt-0.5 leading-snug">
            {tier.description}
          </p>
        </div>
      </div>
    </div>
  );
}
