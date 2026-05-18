"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Lock, Check, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useCartStore, type LoyaltySelection } from "@/stores/cart-store";
import type { LoyaltyTier } from "@/app/api/loyalty/catalog/route";
import {
  LoyaltyTierPicker,
  type LoyaltyPickerSelection,
} from "@/components/storefront/loyalty-tier-picker";

/**
 * Section fidelite v3 dans le panier — tier-based.
 *
 * 3 etats :
 *  1. Guest → banner "Crée un compte pour cumuler"
 *  2. Connecte → liste les 6 paliers avec leur statut (locked/available/picked)
 *     Click sur palier accessible → ouvre le picker (modal multi-step)
 *  3. Recompense engagee → recap inline + bouton "Modifier" / "Retirer"
 *
 * Securite : le client ne voit JAMAIS d'item au-dela des regles du palier
 * (verifie par /api/loyalty/eligible-items). Le serveur revalide a la
 * creation de commande via consume_loyalty_v3.
 */
export function LoyaltyCartSection() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [pickerTier, setPickerTier] = useState<LoyaltyTier | null>(null);

  const loyaltySelection = useCartStore((s) => s.loyaltySelection);
  const setLoyaltySelection = useCartStore((s) => s.setLoyaltySelection);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setUserId(null);
        setChecking(false);
        return;
      }
      setUserId(user.id);

      const [balanceRes, catalogRes] = await Promise.all([
        fetch("/api/loyalty/balance").then((r) => r.json()),
        fetch("/api/loyalty/catalog").then((r) => r.json()),
      ]);
      if (cancelled) return;
      setBalance(balanceRes.points ?? 0);
      setTiers(catalogRes.tiers ?? []);
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup : si la selection persistee n'est plus accessible (balance change,
  // user deconnecte), on la retire.
  useEffect(() => {
    if (!loyaltySelection) return;
    if (!userId) {
      setLoyaltySelection(null);
      return;
    }
    const tier = tiers.find((t) => t.id === loyaltySelection.rewardId);
    if (!tier || balance < tier.pointsCost) {
      setLoyaltySelection(null);
    }
  }, [userId, balance, tiers, loyaltySelection, setLoyaltySelection]);

  const handlePickerConfirm = (sel: LoyaltyPickerSelection) => {
    const newSelection: LoyaltySelection = {
      rewardId: sel.rewardId,
      mainId: sel.mainId,
      friesId: sel.friesId,
      drinkId: sel.drinkId,
      dessertId: sel.dessertId,
    };
    setLoyaltySelection(newSelection);
    setPickerTier(null);
  };

  if (checking) {
    return (
      <div className="mb-5 h-32 rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 animate-pulse" />
    );
  }

  /* ─── Etat 1 : guest ─── */
  if (!userId) {
    return (
      <div className="mb-5 rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0a0a0a] flex items-center justify-center shrink-0 shadow-[0_4px_12px_-4px_rgba(232,65,111,0.4)]">
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

  /* ─── Etat connecte ─── */
  const selectedTier = loyaltySelection
    ? tiers.find((t) => t.id === loyaltySelection.rewardId) ?? null
    : null;
  const affordableCount = tiers.filter((t) => t.pointsCost <= balance).length;
  const nextTier = tiers.find((t) => t.pointsCost > balance) ?? null;

  return (
    <>
      <div className="mb-5 rounded-2xl border border-[#e5e5ea] bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[14px] font-semibold text-[#1d1d1f]">
              {selectedTier ? "Recompense engagee" : "Mes points"}
            </p>
            <p className="text-[11px] text-[#86868b] mt-0.5">
              Solde : <span className="font-semibold text-[#1d1d1f] tabular-nums">{balance} pts</span>
              {!selectedTier && affordableCount > 0 && (
                <> &middot; {affordableCount} palier{affordableCount > 1 ? "s" : ""} dispo</>
              )}
            </p>
          </div>
          {selectedTier && (
            <button
              type="button"
              onClick={() => setLoyaltySelection(null)}
              className="text-[12px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
            >
              Retirer
            </button>
          )}
        </div>

        {selectedTier ? (
          <SelectedRecap
            tier={selectedTier}
            onChange={() => setPickerTier(selectedTier)}
          />
        ) : affordableCount === 0 ? (
          <NoTierYet balance={balance} nextTier={nextTier} />
        ) : (
          <TiersList
            tiers={tiers}
            balance={balance}
            onPick={(tier) => setPickerTier(tier)}
          />
        )}
      </div>

      {/* Picker modal */}
      <AnimatePresence>
        {pickerTier && (
          <LoyaltyTierPicker
            tier={pickerTier}
            onClose={() => setPickerTier(null)}
            onConfirm={handlePickerConfirm}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────── Sub-components ───────── */

function NoTierYet({
  balance,
  nextTier,
}: {
  balance: number;
  nextTier: LoyaltyTier | null;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f7]">
      <div className="h-10 w-10 rounded-xl bg-white border border-[#e5e5ea] flex items-center justify-center shrink-0">
        <Gift className="h-5 w-5 text-[#86868b]" />
      </div>
      <div className="min-w-0 flex-1">
        {nextTier ? (
          <>
            <p className="text-[13px] font-semibold text-[#1d1d1f]">
              Encore{" "}
              <span className="tabular-nums">
                {nextTier.pointsCost - balance} pts
              </span>{" "}
              pour debloquer
            </p>
            <p className="text-[11px] text-[#86868b] mt-0.5">
              {nextTier.name} : {nextTier.description}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-[#86868b]">
            Cumule sur cette commande pour debloquer ton premier palier.
          </p>
        )}
      </div>
    </div>
  );
}

function TiersList({
  tiers,
  balance,
  onPick,
}: {
  tiers: LoyaltyTier[];
  balance: number;
  onPick: (tier: LoyaltyTier) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {tiers.map((tier) => {
        const canAfford = balance >= tier.pointsCost;
        return (
          <motion.button
            type="button"
            key={tier.id}
            disabled={!canAfford}
            onClick={() => canAfford && onPick(tier)}
            whileTap={canAfford ? { scale: 0.98 } : undefined}
            className={`text-left flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
              canAfford
                ? "border-[#e5e5ea] hover:border-[#e8416f]/40 hover:shadow-[0_8px_24px_-12px_rgba(232,65,111,0.2)] hover:-translate-y-px cursor-pointer bg-white"
                : "border-[#e5e5ea] opacity-50 cursor-not-allowed bg-[#fafafa]"
            }`}
          >
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                canAfford
                  ? "bg-[#e8416f] text-white shadow-[0_4px_12px_-4px_rgba(232,65,111,0.5)]"
                  : "bg-[#f5f5f7] text-[#c7c7cc]"
              }`}
            >
              <span className="font-bold text-[15px] tabular-nums">
                {tier.tierLevel}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#1d1d1f]">
                {tier.description}
              </p>
              <p className="text-[11px] text-[#86868b] mt-0.5 tabular-nums">
                {tier.pointsCost} pts
              </p>
            </div>
            <div className="shrink-0">
              {canAfford ? (
                <ArrowRight className="h-4 w-4 text-[#e8416f]" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-[#aeaeb2]" />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function SelectedRecap({
  tier,
  onChange,
}: {
  tier: LoyaltyTier;
  onChange: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#fff5f8] border border-[#e8416f]/30 p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#e8416f] flex items-center justify-center shrink-0 shadow-[0_4px_12px_-4px_rgba(232,65,111,0.5)]">
          <Check className="h-5 w-5 text-white" strokeWidth={3} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#1d1d1f]">
            {tier.description}
          </p>
          <p className="text-[11px] text-[#86868b] mt-0.5 tabular-nums">
            {tier.pointsCost} pts seront debites apres validation
          </p>
          <button
            type="button"
            onClick={onChange}
            className="mt-2 text-[11px] font-semibold text-[#e8416f] hover:underline cursor-pointer"
          >
            Modifier ma selection
          </button>
        </div>
      </div>
    </div>
  );
}
