"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoyaltyTier } from "@/app/api/loyalty/catalog/route";
import type { EligibleItem } from "@/app/api/loyalty/eligible-items/route";
import type {
  OptionGroup,
  ItemVariant,
} from "@/app/api/loyalty/item-options/route";

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
  /** Personnalisation du plat principal (protéine, sauces...) — offert, prix 0 */
  mainExtras: { id: string; name: string }[];
  mainVariantId: string | null;
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

  // Étape "options" du plat principal (protéine, sauces). Quand le client a
  // choisi son sandwich, on charge ses options ; s'il y en a, on affiche ce
  // sous-écran avant de passer au slot suivant.
  const [showOptions, setShowOptions] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [optionVariants, setOptionVariants] = useState<ItemVariant[]>([]);
  const [pickedExtras, setPickedExtras] = useState<
    Record<string, { id: string; name: string }[]>
  >({}); // groupId -> selected
  const [pickedVariant, setPickedVariant] = useState<string | null>(null);

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

  const finalize = useCallback(
    (
      sels: Partial<Record<Slot, string>>,
      extras: { id: string; name: string }[],
      variantId: string | null,
    ) => {
      onConfirm({
        rewardId: tier.id,
        mainId: sels.main ?? null,
        friesId: sels.fries ?? null,
        drinkId: sels.drink ?? null,
        dessertId: sels.dessert ?? null,
        mainExtras: extras,
        mainVariantId: variantId,
      });
    },
    [tier.id, onConfirm],
  );

  const advance = useCallback(
    (sels: Partial<Record<Slot, string>>) => {
      if (stepIdx + 1 < requiredSlots.length) {
        setStepIdx(stepIdx + 1);
      } else {
        // Plus de step : on confirme avec les extras du main deja captures
        const extras = Object.values(pickedExtras).flat();
        finalize(sels, extras, pickedVariant);
      }
    },
    [stepIdx, requiredSlots.length, pickedExtras, pickedVariant, finalize],
  );

  const handlePick = useCallback(
    (itemId: string) => {
      const newSelections = { ...selections, [currentSlot]: itemId };
      setSelections(newSelections);

      // Slot "main" : on charge les options de l'item (protéine, sauces).
      // S'il y en a, on affiche l'étape options avant d'avancer.
      if (currentSlot === "main") {
        setOptionsLoading(true);
        setShowOptions(true);
        setPickedExtras({});
        setPickedVariant(null);
        fetch(`/api/loyalty/item-options?itemId=${itemId}`)
          .then((r) => r.json())
          .then((data) => {
            const groups: OptionGroup[] = data.groups || data.extraGroups || [];
            const variants: ItemVariant[] = data.variants || [];
            setOptionGroups(groups);
            setOptionVariants(variants);
            setOptionsLoading(false);
            // Aucune option a choisir → on skip l'ecran options
            if (groups.length === 0 && variants.length === 0) {
              setShowOptions(false);
              advance(newSelections);
            }
          })
          .catch(() => {
            setOptionsLoading(false);
            setShowOptions(false);
            advance(newSelections);
          });
        return;
      }

      advance(newSelections);
    },
    [selections, currentSlot, advance],
  );

  // Toggle un extra dans un groupe (respecte max : radio si max=1)
  const toggleExtra = useCallback(
    (group: OptionGroup, item: { id: string; name: string }) => {
      setPickedExtras((prev) => {
        const cur = prev[group.id] || [];
        const has = cur.some((e) => e.id === item.id);
        const max = group.maxSelections ?? 99;
        let next: { id: string; name: string }[];
        if (has) {
          next = cur.filter((e) => e.id !== item.id);
        } else if (max === 1) {
          next = [item]; // radio : remplace
        } else if (cur.length < max) {
          next = [...cur, item];
        } else {
          next = cur; // max atteint, ignore
        }
        return { ...prev, [group.id]: next };
      });
    },
    [],
  );

  // Toutes les contraintes min satisfaites ?
  const optionsValid = optionGroups.every(
    (g) => (pickedExtras[g.id]?.length ?? 0) >= (g.minSelections ?? 0),
  );

  const confirmOptions = useCallback(() => {
    if (!optionsValid) return;
    const extras = Object.values(pickedExtras).flat();
    setShowOptions(false);
    advance(selections);
    // Note: advance lit pickedExtras/pickedVariant via closure de finalize
    void extras;
  }, [optionsValid, pickedExtras, selections, advance]);

  const handleBack = () => {
    if (showOptions) {
      // Revenir au choix du plat principal
      setShowOptions(false);
      return;
    }
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
              {stepIdx > 0 || showOptions ? (
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
                  {showOptions ? "Personnalise ton plat" : labels.title}
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
              {showOptions ? "Choisis tes options" : labels.subtitle}
            </p>
          </div>

          {/* Items grid OU étape options du plat principal */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {showOptions ? (
              optionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 text-[#e8416f] animate-spin" />
                </div>
              ) : (
                <div className="space-y-5">
                  {optionVariants.length > 0 && (
                    <div>
                      <p className="text-[13px] font-semibold text-[#1d1d1f] mb-2">
                        Taille / version
                      </p>
                      <div className="space-y-2">
                        {optionVariants.map((v) => (
                          <OptionRow
                            key={v.id}
                            label={v.name}
                            checked={pickedVariant === v.id}
                            radio
                            onClick={() => setPickedVariant(v.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {optionGroups.map((g) => (
                    <div key={g.id}>
                      <p className="text-[13px] font-semibold text-[#1d1d1f] mb-0.5">
                        {g.name}
                      </p>
                      <p className="text-[11px] text-[#86868b] mb-2">
                        {g.minSelections > 0
                          ? `Obligatoire${g.maxSelections === 1 ? " · choisis 1" : ""}`
                          : g.maxSelections
                            ? `Optionnel · max ${g.maxSelections}`
                            : "Optionnel"}
                      </p>
                      <div className="space-y-2">
                        {g.items.map((it) => {
                          const sel = (pickedExtras[g.id] || []).some(
                            (e) => e.id === it.id,
                          );
                          return (
                            <OptionRow
                              key={it.id}
                              label={it.name}
                              checked={sel}
                              radio={g.maxSelections === 1}
                              onClick={() => toggleExtra(g, it)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : loading ? (
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

          {/* Bouton continuer pour l'étape options */}
          {showOptions && !optionsLoading && (
            <div className="px-5 py-3 border-t border-[#e5e5ea]">
              <button
                onClick={confirmOptions}
                disabled={!optionsValid}
                className={cn(
                  "w-full h-12 rounded-2xl font-semibold text-[15px] transition-all",
                  optionsValid
                    ? "bg-[#1d1d1f] text-white hover:bg-[#1d1d1f]/90 active:scale-[0.98]"
                    : "bg-[#e5e5ea] text-[#aeaeb2] cursor-not-allowed",
                )}
              >
                {optionsValid ? "Continuer" : "Choisis les options obligatoires"}
              </button>
            </div>
          )}

          {/* Footer hint (masqué pendant l'étape options) */}
          {!showOptions && (
            <div className="px-5 py-3 border-t border-[#e5e5ea] bg-[#fafafa]">
              <p className="text-[11px] text-[#86868b] text-center">
                {stepIdx + 1} / {requiredSlots.length} ·{" "}
                {requiredSlots.length > 1
                  ? "Choisis pour passer a l'etape suivante"
                  : "Choisis pour valider"}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function OptionRow({
  label,
  checked,
  radio,
  onClick,
}: {
  label: string;
  checked: boolean;
  radio?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
        checked
          ? "border-[#e8416f] bg-[#fff5f8]"
          : "border-[#e5e5ea] hover:border-[#e8416f]/40",
      )}
    >
      <span
        className={cn(
          "h-5 w-5 shrink-0 flex items-center justify-center border-2",
          radio ? "rounded-full" : "rounded-md",
          checked ? "border-[#e8416f] bg-[#e8416f]" : "border-[#d1d1d6]",
        )}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      <span className="text-[14px] text-[#1d1d1f]">{label}</span>
    </button>
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
