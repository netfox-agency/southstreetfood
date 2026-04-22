"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gift, Lock, Check, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";
import type { LoyaltyCatalogItem } from "@/app/api/loyalty/catalog/route";

/**
 * Section fidelite dans le panier.
 *
 * 3 etats :
 *  1. Guest → banner "Crée un compte, gagne X pts + bonus 50"
 *  2. Connecte sans assez de points → encouragement + progress
 *  3. Connecte avec au moins 100 pts → selecteur de recompense (radio)
 *
 * Realtime : rafraichit balance au mount. Pas besoin de subscription
 * live car les points sont credites apres livraison, pas en temps reel
 * dans le cart.
 */
export function LoyaltyCartSection() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [catalog, setCatalog] = useState<LoyaltyCatalogItem[]>([]);
  const loyaltyRewardId = useCartStore((s) => s.loyaltyRewardId);
  const setLoyaltyRewardId = useCartStore((s) => s.setLoyaltyRewardId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        // Guest : on affiche juste le banner, inutile de fetch catalogue
        setUserId(null);
        setChecking(false);
        return;
      }
      setUserId(user.id);

      // Fetch balance + catalog en parallele
      const [balanceRes, catalogRes] = await Promise.all([
        fetch("/api/loyalty/balance").then((r) => r.json()),
        fetch("/api/loyalty/catalog").then((r) => r.json()),
      ]);
      if (cancelled) return;
      setBalance(balanceRes.points ?? 0);
      setCatalog(catalogRes.rewards ?? []);
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Clean up: si la recompense selectionnee n'est plus accessible (user a
  // switche de compte, balance a change), on deselectionne.
  useEffect(() => {
    if (!loyaltyRewardId) return;
    if (!userId) {
      setLoyaltyRewardId(null);
      return;
    }
    const r = catalog.find((c) => c.id === loyaltyRewardId);
    if (r && balance < r.pointsCost) setLoyaltyRewardId(null);
  }, [userId, balance, catalog, loyaltyRewardId, setLoyaltyRewardId]);

  if (checking) {
    return (
      <div className="mb-5 h-20 rounded-2xl bg-white border border-[#e5e5ea] animate-pulse" />
    );
  }

  /* ─── Etat 1 : guest ─── */
  if (!userId) {
    return (
      <div className="mb-5 rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0a0a0a] flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[#1d1d1f] leading-tight">
              Gagne des points sur cette commande
            </p>
            <p className="text-[12px] text-[#86868b] mt-0.5 leading-relaxed">
              Cree ton compte pour cumuler des points a chaque commande.{" "}
              <span className="font-semibold text-[#1d1d1f]">
                1 euro depense = 1 point.
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/auth/signup?redirect=/cart"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#0a0a0a] text-white text-[13px] font-semibold hover:bg-[#1d1d1f] transition-colors"
              >
                Creer un compte
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/auth/login?redirect=/cart"
                className="inline-flex items-center h-9 px-4 rounded-full border border-[#e5e5ea] text-[#1d1d1f] text-[13px] font-semibold hover:bg-[#f5f5f7] transition-colors"
              >
                Me connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Etat 2 : connecte sans recompense accessible ─── */
  const affordable = catalog.filter((r) => r.pointsCost <= balance);
  const nextReward = catalog.find((r) => r.pointsCost > balance);

  if (affordable.length === 0) {
    return (
      <div className="mb-5 rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-[#86868b]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <p className="text-[14px] font-semibold text-[#1d1d1f]">
                Solde : {balance} pts
              </p>
            </div>
            {nextReward ? (
              <p className="text-[12px] text-[#86868b] mt-0.5 leading-relaxed">
                Encore{" "}
                <span className="font-semibold text-[#1d1d1f]">
                  {nextReward.pointsCost - balance} pts
                </span>{" "}
                pour debloquer &laquo; {nextReward.name} &raquo;.
              </p>
            ) : (
              <p className="text-[12px] text-[#86868b] mt-0.5">
                Commence a cumuler des points sur cette commande.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Etat 3 : connecte avec au moins une recompense ─── */
  return (
    <div className="mb-5 rounded-2xl border border-[#e5e5ea] bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[14px] font-semibold text-[#1d1d1f]">
            Utiliser mes points
          </p>
          <p className="text-[11px] text-[#86868b] mt-0.5">
            Solde : {balance} pts &middot; 1 recompense par commande
          </p>
        </div>
        {loyaltyRewardId && (
          <button
            type="button"
            onClick={() => setLoyaltyRewardId(null)}
            className="text-[12px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
          >
            Retirer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {catalog.map((r) => {
          const canAfford = balance >= r.pointsCost;
          const selected = loyaltyRewardId === r.id;
          return (
            <button
              type="button"
              key={r.id}
              disabled={!canAfford}
              onClick={() => setLoyaltyRewardId(selected ? null : r.id)}
              className={`text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selected
                  ? "border-[#0a0a0a] bg-[#0a0a0a]/[0.02] cursor-pointer"
                  : canAfford
                    ? "border-[#e5e5ea] hover:border-[#0a0a0a]/30 cursor-pointer"
                    : "border-[#e5e5ea] opacity-60 cursor-not-allowed"
              }`}
              aria-pressed={selected}
            >
              <div className="relative h-14 w-14 shrink-0 rounded-lg bg-[#f5f5f7] overflow-hidden">
                {r.imageUrl ? (
                  <Image
                    src={r.imageUrl}
                    alt={r.name}
                    fill
                    sizes="56px"
                    className={`object-contain p-1.5 ${canAfford ? "" : "grayscale"}`}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Gift className="h-5 w-5 text-[#c7c7cc]" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#1d1d1f] truncate">
                  {r.name}
                </p>
                <p className="text-[11px] text-[#86868b]">
                  {r.pointsCost} pts
                  {r.menuItemPrice !== null && (
                    <>
                      {" "}
                      &middot; Valeur{" "}
                      {(r.menuItemPrice / 100).toFixed(2).replace(".", ",")}{" "}
                      &euro;
                    </>
                  )}
                </p>
              </div>
              <div
                className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${
                  selected
                    ? "bg-[#0a0a0a] border-[#0a0a0a]"
                    : canAfford
                      ? "bg-white border-[#c7c7cc]"
                      : "bg-[#f5f5f7] border-[#e5e5ea]"
                }`}
              >
                {selected ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : !canAfford ? (
                  <Lock className="h-3 w-3 text-[#aeaeb2]" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {loyaltyRewardId && (
        <p className="mt-3 text-[11px] text-[#86868b] leading-relaxed">
          Ta recompense sera ajoutee gratuitement a la commande. Les points
          seront debites apres validation.
        </p>
      )}
    </div>
  );
}
