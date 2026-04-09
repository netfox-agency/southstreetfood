"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Minus,
  Plus,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExtraItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

interface ExtraGroup {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number | null;
  items: ExtraItem[];
}

interface Variant {
  id: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
  is_available: boolean;
}

interface ItemData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  allergens: string[] | null;
  categories: { name: string; slug: string } | null;
  variants: Variant[];
  extra_groups: ExtraGroup[];
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " \u20ac";
}

/** Build the subtitle under each group header — Uber-style */
function groupSubtitle(g: ExtraGroup): string {
  const { min_selections: min, max_selections: max } = g;
  // Unbounded upper (e.g. 9990/3996) → treat as unlimited
  const unbounded = max === null || max >= 999;
  if (min === 1 && max === 1) return "Choisir 1";
  if (min === 0 && max === 1) return "Choisir 1 max";
  if (min > 0 && !unbounded && max === min) return `Choisir ${min}`;
  if (min > 0 && !unbounded) return `Choisir entre ${min} et ${max}`;
  if (min === 0 && !unbounded) return `Choisir jusqu'a ${max} max`;
  if (min > 0 && unbounded) return `Min ${min}`;
  return "Choisir";
}

export function ItemClient({ item }: { item: ItemData }) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    item.variants.find((v) => v.is_default) || item.variants[0] || null
  );
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const toggleExtra = (extraId: string, groupId: string) => {
    const group = item.extra_groups.find((g) => g.id === groupId);
    if (!group) return;

    setSelectedExtras((prev) => {
      const next = new Set(prev);
      // Single-select group (max 1) → replace behavior
      if (group.max_selections === 1) {
        group.items.forEach((gi) => next.delete(gi.id));
        if (!prev.has(extraId)) next.add(extraId);
        return next;
      }
      if (next.has(extraId)) {
        next.delete(extraId);
      } else {
        if (group.max_selections !== null && group.max_selections < 999) {
          const groupSelected = group.items.filter((i) =>
            next.has(i.id)
          ).length;
          if (groupSelected >= group.max_selections) return prev;
        }
        next.add(extraId);
      }
      return next;
    });
  };

  const selectedExtrasList = item.extra_groups.flatMap((g) =>
    g.items.filter((e) => selectedExtras.has(e.id))
  );

  const extrasTotal = selectedExtrasList.reduce((sum, e) => sum + e.price, 0);
  const variantMod = selectedVariant?.price_modifier || 0;
  const unitPrice = item.base_price + variantMod;
  const lineTotal = (unitPrice + extrasTotal) * quantity;

  const handleAddToCart = () => {
    for (const group of item.extra_groups) {
      if (group.min_selections > 0) {
        const count = group.items.filter((i) =>
          selectedExtras.has(i.id)
        ).length;
        if (count < group.min_selections) {
          toast.error(
            `Selectionne au moins ${group.min_selections} option(s) dans "${group.name.replace(/^[^a-zA-Z]*\s?/, "")}"`
          );
          return;
        }
      }
    }

    addItem({
      menuItemId: item.id,
      menuItemName: item.name,
      menuItemImage: item.image_url,
      variantId: selectedVariant?.id || null,
      variantName: selectedVariant?.name || null,
      extras: selectedExtrasList.map((e) => ({
        id: e.id,
        name: e.name,
        price: e.price,
      })),
      quantity,
      unitPrice,
      extrasPrice: extrasTotal,
      specialInstructions: null,
    });
    toast.success(`${item.name} ajoute au panier`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─────────────────────────────────────────
          LAYOUT: stacked on mobile, split on lg+
          ───────────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:min-h-screen">
        {/* ═══ IMAGE (left on desktop, top on mobile) ═══ */}
        <div className="relative lg:sticky lg:top-0 lg:h-screen lg:self-start">
          {/* Close button overlay */}
          <Link
            href="/menu"
            aria-label="Retour au menu"
            className="absolute top-4 left-4 z-10 h-10 w-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <X className="h-5 w-5 text-foreground" />
          </Link>

          <div className="relative aspect-square lg:aspect-auto lg:h-full w-full bg-gradient-to-br from-muted to-background overflow-hidden">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-9xl">
                {item.categories?.slug === "burgers-premium"
                  ? "🍔"
                  : item.categories?.slug === "wraps"
                  ? "🌯"
                  : item.categories?.slug === "fit"
                  ? "🥗"
                  : "🌮"}
              </div>
            )}
          </div>
        </div>

        {/* ═══ CONTENT (right on desktop, below on mobile) ═══ */}
        <div className="relative">
          <div className="max-w-xl mx-auto px-5 sm:px-8 py-8 pb-32 lg:pb-40">
            {/* Title block */}
            <div className="mb-8">
              <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-foreground leading-tight">
                {item.name}
              </h1>
              <div className="mt-2 text-[22px] font-bold text-foreground">
                {formatPrice(item.base_price)}
              </div>
              {item.description && (
                <p className="mt-4 text-[15px] leading-[1.55] text-muted-foreground whitespace-pre-line">
                  {item.description}
                </p>
              )}
              {item.is_featured && (
                <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-[13px] font-medium text-foreground">
                  #1 Le plus aime
                </div>
              )}
              {item.allergens && item.allergens.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Allergenes : {item.allergens.join(", ")}
                </div>
              )}
            </div>

            {/* Variants */}
            {item.variants.length > 1 && (
              <div className="mb-8 pt-6 border-t border-border">
                <div className="mb-1">
                  <h2 className="text-[17px] font-bold text-foreground">
                    Choisir une formule
                  </h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Choisir 1
                  </p>
                </div>
                <div className="mt-4 divide-y divide-border">
                  {item.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={!v.is_available}
                      className={cn(
                        "w-full flex items-center justify-between py-4 text-left cursor-pointer",
                        !v.is_available && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[15px] text-foreground">
                          {v.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {v.price_modifier > 0 && (
                          <span className="text-[13px] text-muted-foreground">
                            +{formatPrice(v.price_modifier)}
                          </span>
                        )}
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                            selectedVariant?.id === v.id
                              ? "border-foreground"
                              : "border-border"
                          )}
                        >
                          {selectedVariant?.id === v.id && (
                            <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extra groups */}
            {item.extra_groups.map((group) => {
              const groupSelectedCount = group.items.filter((i) =>
                selectedExtras.has(i.id)
              ).length;
              const effectiveMax =
                group.max_selections !== null && group.max_selections < 999
                  ? group.max_selections
                  : null;
              const atMax =
                effectiveMax !== null && groupSelectedCount >= effectiveMax;
              const isRequired = group.min_selections > 0;
              const isSingleSelect = group.max_selections === 1;

              return (
                <div key={group.id} className="mb-8 pt-6 border-t border-border">
                  {/* Header row with required badge */}
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div className="min-w-0">
                      <h2 className="text-[17px] font-bold text-foreground leading-tight">
                        {group.name}
                      </h2>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        {groupSubtitle(group)}
                      </p>
                    </div>
                    {isRequired && (
                      <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-[12px] font-medium text-foreground">
                        Obligatoire
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div className="mt-3 divide-y divide-border">
                    {group.items.map((extra) => {
                      const isSelected = selectedExtras.has(extra.id);
                      const isDisabled =
                        !extra.is_available || (atMax && !isSelected);

                      return (
                        <button
                          key={extra.id}
                          onClick={() => toggleExtra(extra.id, group.id)}
                          disabled={isDisabled}
                          className={cn(
                            "w-full flex items-center justify-between py-3.5 text-left cursor-pointer transition-opacity",
                            isDisabled && !isSelected && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <span className="text-[15px] text-foreground">
                            {extra.name}
                          </span>
                          <div className="flex items-center gap-3 shrink-0">
                            {extra.price > 0 && (
                              <span className="text-[13px] text-muted-foreground">
                                +{formatPrice(extra.price)}
                              </span>
                            )}
                            {isSingleSelect ? (
                              <div
                                className={cn(
                                  "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                  isSelected
                                    ? "border-foreground"
                                    : "border-border"
                                )}
                              >
                                {isSelected && (
                                  <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                                )}
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
                                  isSelected
                                    ? "bg-foreground border-foreground"
                                    : "border-border"
                                )}
                              >
                                {isSelected && (
                                  <Check className="h-3 w-3 text-background" />
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ STICKY BOTTOM CTA ═══ */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-1/2 bg-background border-t border-border px-5 py-4 z-20">
            <div className="max-w-xl mx-auto flex items-center gap-4">
              <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Diminuer"
                  className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-background transition-colors cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Augmenter"
                  className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-background transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!item.is_available}
                className="flex-1 h-12 rounded-full bg-foreground text-background font-semibold text-[15px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ajouter {quantity} au panier &middot; {formatPrice(lineTotal)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
