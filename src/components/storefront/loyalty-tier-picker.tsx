"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoyaltyTier } from "@/app/api/loyalty/catalog/route";
import type { EligibleItem } from "@/app/api/loyalty/eligible-items/route";

/**
 * Picker pour un palier fidelite.
 *
 * Bottom-sheet sur mobile (zone pouce), modal centree sur desktop.
 * Multi-step : main → fries → drink → dessert (selon les slots du palier).
 * Au dernier step, "Confirmer" engage la selection dans le cart store.
 *
 * Securite : les items proposes viennent de /api/loyalty/eligible-items
 * qui valide les regles serveur-side. Le client ne peut pas afficher
 * un item exclu meme s'il bidouille l'URL.
 */

type Slot = "main" | "fries" | "drink" | "dessert";

const SLOT_LABELS: Record<Slot, { title: string; subtitle: string }> = {
  main: {
    title: "Choisis ton sandwich",
    subtitle: "Burger, wrap, tacos ou bowl",
  },
  fries: { title: "Choisis tes frites", subtitle: "Une portion offerte" },
  drink: { title: "Choisis ta boisson", subtitle: "33cl, au choix" },
  dessert: { title: "Choisis ton dessert", subtitle: "Au choix" },
};

export interface LoyaltyPickerSelection {
  rewardId: string;
  mainId: string | null;
  friesId: string | null;
  drinkId: string | null;
  dessertId: string | null;
}

interface Props {
  tier: LoyaltyTier;
  onClose: () => void;
  onConfirm: (selection: LoyaltyPickerSelection) => void;
}

export function LoyaltyTierPicker({ tier, onClose, onConfirm }: Props) {
  // Determine l'ordre des slots a remplir
  const requiredSlots: Slot[] = [
    tier.slots.main ? "main" : null,
    tier.slots.fries ? "fries" : null,
    tier.slots.drink ? "drink" : null,
    tier.slots.dessert ? "dessert" : null,
  ].filter(Boolean) as Slot[];

  const [stepIdx, setStepIdx] = useState(0);
  const [selections, setSelections] = useState<Partial<Record<Slot, string>>>(
    {},
  );
  const [items, setItems] = useState<EligibleItem[]>([]);
  const [loading, setLoading] = useState(false);

  const currentSlot = requiredSlots[stepIdx];

  // Fetch items eligibles pour le slot actuel
  useEffect(() => {
    if (!currentSlot) return;
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/loyalty/eligible-items?tierId=${tier.id}&slot=${currentSlot}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tier.id, currentSlot]);

  // ESC = close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handlePick = useCallback(
    (itemId: string) => {
      const newSelections = { ...selections, [currentSlot]: itemId };
      setSelections(newSelections);

      // Auto-advance au step suivant. Si c'est le dernier, confirm.
      if (stepIdx + 1 < requiredSlots.length) {
        setStepIdx(stepIdx + 1);
      } else {
        onConfirm({
          rewardId: tier.id,
          mainId: newSelections.main ?? null,
          friesId: newSelections.fries ?? null,
          drinkId: newSelections.drink ?? null,
          dessertId: newSelections.dessert ?? null,
        });
      }
    },
    [selections, currentSlot, stepIdx, requiredSlots.length, tier.id, onConfirm],
  );

  const handleBack = () => {
    if (stepIdx === 0) {
      onClose();
    } else {
      setStepIdx(stepIdx - 1);
    }
  };

  const labels = SLOT_LABELS[currentSlot];
  const progress = ((stepIdx + 1) / requiredSlots.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.4)] max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header avec progress bar */}
          <div className="relative px-5 pt-4 pb-3 border-b border-[#e5e5ea]">
            {/* iOS-style swipe handle (mobile only) */}
            <div className="sm:hidden absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[#d1d1d6]" />

            <div className="flex items-center gap-3">
              {stepIdx > 0 ? (
                <button
                  onClick={handleBack}
                  className="h-8 w-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                  aria-label="Etape precedente"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : (
                <div className="w-8" />
              )}

              <div className="flex-1 min-w-0 text-center">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-[#86868b]">
                  {tier.name} · {tier.pointsCost} pts
                </p>
                <h2 className="font-display text-xl text-[#1d1d1f] tracking-tight leading-tight mt-0.5">
                  {labels.title}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar (steps) */}
            {requiredSlots.length > 1 && (
              <div className="mt-3 h-1 rounded-full bg-[#f0f0f2] overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-[#e8416f]"
                />
              </div>
            )}
            <p className="mt-2 text-[12px] text-[#86868b] text-center">
              {labels.subtitle}
            </p>
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-[#e8416f] animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[#86868b]">
                  Aucun item disponible pour ce slot.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    selected={selections[currentSlot] === item.id}
                    onClick={() => handlePick(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-[#e5e5ea] bg-[#fafafa]">
            <p className="text-[11px] text-[#86868b] text-center">
              {stepIdx + 1} / {requiredSlots.length} ·{" "}
              {requiredSlots.length > 1
                ? "Choisis pour passer a l'etape suivante"
                : "Choisis pour valider"}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ItemCard({
  item,
  selected,
  onClick,
}: {
  item: EligibleItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group flex flex-col rounded-2xl border bg-white overflow-hidden text-left",
        "transition-all duration-200 active:scale-[0.98]",
        selected
          ? "border-[#e8416f] shadow-[0_8px_24px_-8px_rgba(232,65,111,0.35)]"
          : "border-[#e5e5ea] hover:border-[#e8416f]/40 hover:shadow-[0_8px_24px_-12px_rgba(232,65,111,0.2)]",
      )}
    >
      <div className="relative aspect-square bg-[#f5f5f7]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}
        {selected && (
          <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-[#e8416f] flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(232,65,111,0.5)]">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[13px] font-semibold text-[#1d1d1f] leading-tight line-clamp-2">
          {item.name}
        </p>
        <p className="text-[11px] text-[#86868b] mt-0.5">
          Valeur {(item.basePrice / 100).toFixed(2).replace(".", ",")} €
        </p>
      </div>
    </button>
  );
}
