import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LOYALTY } from "@/lib/constants";
import type { LoyaltyCatalogItem } from "@/app/api/loyalty/catalog/route";

interface Props {
  catalog: LoyaltyCatalogItem[];
}

/**
 * Etat non connecte. On explique la promesse en 3 lignes (1€=1pt,
 * bonus bienvenue, recompenses), on teaser le catalogue avec les
 * vraies images produits, et on pousse l'inscription.
 *
 * Zero emoji, zero icon-in-circle, zero gradient purple cheap.
 * Typo Pricedown pour le chiffre cle, le reste sobre comme Apple.
 */
export function FideliteGuest({ catalog }: Props) {
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

      {/* Hero noir + Pricedown. Pas de gradient chelou, pas d'icone. */}
      <section className="mx-auto max-w-5xl px-5 mt-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] text-white px-8 py-14 sm:px-12 sm:py-20">
          <div className="relative z-10 max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#e8416f] mb-4">
              South Street Rewards
            </p>
            <h1 className="font-display text-5xl sm:text-7xl leading-[0.95] tracking-tight mb-4">
              1 euro<br />= 1 point.
            </h1>
            <p className="text-[15px] sm:text-base text-white/70 max-w-lg leading-relaxed mb-8">
              Chaque commande compte. Cumule tes points, echange-les
              contre tes plats preferes. {LOYALTY.welcomeBonus} points
              offerts a la creation du compte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
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

          {/* Subtle brand accent (pas de glow cheap) */}
          <div
            aria-hidden
            className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-[#e8416f]/10 blur-3xl"
          />
        </div>
      </section>

      {/* 3 promesses, style Apple feature list */}
      <section className="mx-auto max-w-5xl px-5 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ValueProp
            step="01"
            title="Tu commandes"
            body="Comme d'habitude, depuis ton compte. Aucune carte, aucun code, aucun scan."
          />
          <ValueProp
            step="02"
            title="Tu cumules"
            body="1 euro depense = 1 point ajoute a ton solde apres chaque commande livree."
          />
          <ValueProp
            step="03"
            title="Tu te fais plaisir"
            body="Des 100 points, echange ton solde contre frites, boisson, dessert ou burger offert."
          />
        </div>
      </section>

      {/* Catalogue */}
      <section className="mx-auto max-w-5xl px-5 mt-14 mb-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-[22px] sm:text-[26px] font-bold text-[#1d1d1f] tracking-tight">
              Les recompenses
            </h2>
            <p className="text-sm text-[#86868b] mt-1">
              Un apercu de ce qui t&apos;attend.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {catalog.map((r) => (
            <RewardPreview key={r.id} reward={r} />
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="rounded-2xl bg-[#f5f5f7] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#1d1d1f]">
              Pret a cumuler ?
            </p>
            <p className="text-sm text-[#86868b] mt-0.5">
              {LOYALTY.welcomeBonus} points offerts immediatement.
            </p>
          </div>
          <Link
            href="/auth/signup?redirect=/fidelite"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#0a0a0a] text-white font-semibold text-sm hover:bg-[#1d1d1f] transition-colors whitespace-nowrap"
          >
            Creer mon compte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ValueProp({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f5f5f7] p-5 sm:p-6">
      <span className="font-display text-2xl text-[#e8416f]">{step}</span>
      <h3 className="mt-2 font-semibold text-[15px] text-[#1d1d1f]">
        {title}
      </h3>
      <p className="mt-1 text-[13px] text-[#86868b] leading-relaxed">{body}</p>
    </div>
  );
}

function RewardPreview({ reward }: { reward: LoyaltyCatalogItem }) {
  return (
    <div className="group relative rounded-2xl bg-[#f5f5f7] overflow-hidden aspect-[4/5] flex flex-col">
      <div className="relative flex-1 bg-gradient-to-b from-white to-[#f0f0f2]">
        {reward.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <Image
            src={reward.imageUrl}
            alt={reward.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-contain p-4 sm:p-6"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#c7c7cc] text-xs">
            Photo a venir
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 bg-[#0a0a0a] text-white text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-full">
          {reward.pointsCost} pts
        </div>
      </div>
      <div className="p-3 sm:p-4 bg-white">
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
    </div>
  );
}
