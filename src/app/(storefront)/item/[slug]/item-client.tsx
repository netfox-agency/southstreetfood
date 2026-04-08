"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
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
      if (next.has(extraId)) {
        next.delete(extraId);
      } else {
        // Check max selections for this group
        if (group.max_selections) {
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
    // Validate min selections
    for (const group of item.extra_groups) {
      if (group.min_selections > 0) {
        const count = group.items.filter((i) =>
          selectedExtras.has(i.id)
        ).length;
        if (count < group.min_selections) {
          toast.error(
            `Selectionnez au moins ${group.min_selections} option(s) dans "${group.name}"`
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
      <div className="max-w-2xl mx-auto px-5 py-8">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au menu
        </Link>

        {/* Product image */}
        <div className="relative aspect-[16/10] rounded-2xl bg-gradient-to-br from-muted to-background overflow-hidden mb-6">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">
              {item.categories?.slug === "burgers-premium"
                ? "🍔"
                : item.categories?.slug === "wraps"
                ? "🌯"
                : item.categories?.slug === "fit"
                ? "🥗"
                : "🌮"}
            </div>
          )}
          {item.is_featured && (
            <span className="absolute top-4 left-4 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full">
              Populaire
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mb-6">
          {item.categories && (
            <p className="text-brand text-sm font-medium mb-1">
              {item.categories.name}
            </p>
          )}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">{item.name}</h1>
            <span className="text-xl font-bold text-foreground shrink-0">
              {formatPrice(item.base_price)}
            </span>
          </div>
          {item.description && (
            <p className="mt-2 text-muted-foreground text-[15px] leading-relaxed">
              {item.description}
            </p>
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
          <div className="mb-6">
            <h2 className="font-semibold text-foreground text-[15px] mb-3">
              Choisir une formule
            </h2>
            <div className="space-y-2">
              {item.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  disabled={!v.is_available}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                    selectedVariant?.id === v.id
                      ? "border-foreground bg-foreground/[0.03]"
                      : "border-border hover:border-foreground/20",
                    !v.is_available && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                        selectedVariant?.id === v.id
                          ? "border-foreground"
                          : "border-border"
                      )}
                    >
                      {selectedVariant?.id === v.id && (
                        <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{v.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {v.price_modifier === 0
                      ? "Inclus"
                      : `+${formatPrice(v.price_modifier)}`}
                  </span>
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
          const atMax =
            group.max_selections !== null &&
            groupSelectedCount >= group.max_selections;

          return (
            <div key={group.id} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground text-[15px]">
                  {group.name}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {group.min_selections > 0 && `Min ${group.min_selections}`}
                  {group.min_selections > 0 && group.max_selections && " · "}
                  {group.max_selections && `Max ${group.max_selections}`}
                  {group.max_selections &&
                    ` (${groupSelectedCount}/${group.max_selections})`}
                </span>
              </div>
              <div className="space-y-2">
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
                        "w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                        isSelected
                          ? "border-foreground bg-foreground/[0.03]"
                          : "border-border hover:border-foreground/20",
                        isDisabled && !isSelected && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
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
                        <span className="text-sm font-medium">
                          {extra.name}
                        </span>
                      </div>
                      {extra.price > 0 && (
                        <span className="text-sm text-muted-foreground">
                          +{formatPrice(extra.price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Sticky bottom: quantity + add to cart */}
        <div className="sticky bottom-0 bg-background border-t border-border -mx-5 px-5 py-4 mt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-background transition-colors cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-background transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!item.is_available}
              className="flex-1 btn-primary justify-center !py-3.5"
            >
              <ShoppingBag className="h-4 w-4" />
              Ajouter — {formatPrice(lineTotal)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
