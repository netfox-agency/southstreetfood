"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { MENU_UPGRADE_PRICE } from "@/lib/constants";

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

interface MenuDrinkOption {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  supplement: number;
}

interface MenuFriesOption {
  slug: string;
  label: string;
  supplement: number;
}

interface MenuOptions {
  drinks: MenuDrinkOption[];
  fries: MenuFriesOption[];
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

export function ItemClient({
  item,
  isMenuEligible = false,
  menuOptions = null,
}: {
  item: ItemData;
  isMenuEligible?: boolean;
  menuOptions?: MenuOptions | null;
}) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    item.variants.find((v) => v.is_default && v.is_available) ||
    item.variants.find((v) => v.is_available) ||
    null
  );
  const [selectedExtras, setSelectedExtras] = useState<Map<string, number>>(new Map());
  const [quantity, setQuantity] = useState(1);
  // ── Menu (formule) state ──
  const [isMenu, setIsMenu] = useState(false);
  const [menuDrinkId, setMenuDrinkId] = useState<string | null>(null);
  const [menuFriesSlug, setMenuFriesSlug] = useState<string | null>(
    menuOptions?.fries[0]?.slug ?? null, // default: salées (first option, 0€ supplement)
  );
  const addItem = useCartStore((s) => s.addItem);

  const isUnbounded = (group: ExtraGroup) =>
    group.max_selections === null || group.max_selections >= 999;

  /**
   * When the customer picks "En Menu", the dedicated menu selectors already
   * cover drink + fries — hide any extra group that duplicates that choice
   * (the seed groups "🥤 Rafraichit Toi" / "🍟 Accompagnement gourmand") so
   * the customer isn't asked twice.
   */
  const isHiddenByMenu = (group: ExtraGroup) => {
    if (!isMenu) return false;
    const lower = group.name.toLowerCase();
    return (
      lower.includes("boisson") ||
      lower.includes("rafra") ||
      lower.includes("frite") ||
      lower.includes("accompagn")
    );
  };

  const visibleExtraGroups = item.extra_groups.filter((g) => !isHiddenByMenu(g));

  const toggleExtra = (extraId: string, groupId: string) => {
    const group = item.extra_groups.find((g) => g.id === groupId);
    if (!group) return;

    setSelectedExtras((prev) => {
      const next = new Map(prev);
      if (group.max_selections === 1) {
        group.items.forEach((gi) => next.delete(gi.id));
        if (!prev.has(extraId)) next.set(extraId, 1);
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
        next.set(extraId, 1);
      }
      return next;
    });
  };

  const setExtraQty = (extraId: string, qty: number) => {
    setSelectedExtras((prev) => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(extraId);
      } else {
        next.set(extraId, qty);
      }
      return next;
    });
  };

  // Only include extras from visible groups — anything selected in a
  // menu-hidden group (drinks/fries) is ignored while in Menu mode so the
  // customer isn't double-charged if they had pre-selected before toggling.
  const selectedExtrasList = visibleExtraGroups.flatMap((g) =>
    g.items
      .filter((e) => selectedExtras.has(e.id))
      .flatMap((e) => {
        const qty = selectedExtras.get(e.id) || 1;
        return Array.from({ length: qty }, () => e);
      })
  );

  const extrasTotal = selectedExtrasList.reduce((sum, e) => sum + e.price, 0);
  const variantMod = selectedVariant?.price_modifier || 0;

  // ── Menu (formule) pricing ──
  const selectedDrink =
    isMenu && menuDrinkId
      ? menuOptions?.drinks.find((d) => d.id === menuDrinkId) ?? null
      : null;
  const selectedFries =
    isMenu && menuFriesSlug
      ? menuOptions?.fries.find((f) => f.slug === menuFriesSlug) ?? null
      : null;
  const menuUpgrade = isMenu ? MENU_UPGRADE_PRICE : 0;
  const menuDrinkSupp = selectedDrink?.supplement ?? 0;
  const menuFriesSupp = selectedFries?.supplement ?? 0;
  const menuTotal = menuUpgrade + menuDrinkSupp + menuFriesSupp;

  const unitPrice = item.base_price + variantMod + menuTotal;
  const lineTotal = (unitPrice + extrasTotal) * quantity;

  const handleAddToCart = () => {
    // Validate only groups that are actually shown — hidden groups (drinks/fries
    // in Menu mode) are covered by the dedicated menu selectors below.
    for (const group of visibleExtraGroups) {
      if (group.min_selections > 0) {
        const count = group.items.reduce(
          (sum, i) => sum + (selectedExtras.get(i.id) || 0),
          0
        );
        if (count < group.min_selections) {
          toast.error(
            `Selectionne au moins ${group.min_selections} option(s) dans "${group.name.replace(/^[^a-zA-Z]*\s?/, "")}"`
          );
          return;
        }
      }
    }

    // ── Menu validation ──
    if (isMenu) {
      if (!selectedFries) {
        toast.error("Choisis tes frites pour le menu");
        return;
      }
      if (!selectedDrink) {
        toast.error("Choisis ta boisson pour le menu");
        return;
      }
    }

    // Build extras list — for menu mode, prepend virtual "fries" and "drink" lines
    // so the cart and kitchen ticket show exactly what the customer chose.
    const allExtras = [...selectedExtrasList];
    if (isMenu && selectedFries && selectedDrink) {
      allExtras.unshift(
        {
          id: `menu-fries-${selectedFries.slug}`,
          name: `🍟 ${selectedFries.label}${selectedFries.supplement > 0 ? "" : " (incluses)"}`,
          price: 0, // supplements baked into unitPrice above, don't double-count
        } as ExtraItem,
        {
          id: `menu-drink-${selectedDrink.id}`,
          name: `🥤 ${selectedDrink.name}${selectedDrink.supplement > 0 ? "" : " (incluse)"}`,
          price: 0, // same — baked into unitPrice
        } as ExtraItem,
      );
    }

    addItem({
      menuItemId: item.id,
      menuItemName: isMenu ? `${item.name} · En Menu` : item.name,
      menuItemImage: item.image_url,
      variantId: selectedVariant?.id || null,
      variantName: selectedVariant?.name || null,
      extras: allExtras.map((e) => ({
        id: e.id,
        name: e.name,
        price: e.price,
      })),
      quantity,
      unitPrice,
      extrasPrice: extrasTotal,
      specialInstructions: null,
    });
    toast.success(
      isMenu ? `${item.name} en Menu ajouté au panier` : `${item.name} ajouté au panier`,
    );
    // Uber Eats behaviour: once added, bounce back to the menu so the
    // customer can keep browsing and composing their order.
    router.push("/menu");
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
            {/* Unavailability banner */}
            {!item.is_available && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Cet article est actuellement indisponible
              </div>
            )}

            {/* Title block */}
            <div className="mb-8">
              <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-foreground leading-tight">
                {item.name}
              </h1>
              <div className="mt-2 text-[22px] font-bold text-foreground">
                {formatPrice(unitPrice)}
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

            {/* ═══ MENU TOGGLE (formule +3€) ═══ */}
            {isMenuEligible && menuOptions && (
              <div className="mb-8 pt-6 border-t border-border">
                <div className="mb-3">
                  <h2 className="text-[17px] font-bold text-foreground leading-tight">
                    Tu veux en Menu ?
                  </h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Menu = frites + boisson 33cl pour +3€
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMenu(false)}
                    className={cn(
                      "relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all cursor-pointer text-left",
                      !isMenu
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/40",
                    )}
                  >
                    <span className="text-[15px] font-bold text-foreground">
                      Seul
                    </span>
                    <span className="text-[13px] text-muted-foreground mt-1">
                      {formatPrice(item.base_price + variantMod)}
                    </span>
                    {!isMenu && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-foreground flex items-center justify-center">
                        <Check className="h-3 w-3 text-background" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMenu(true)}
                    className={cn(
                      "relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all cursor-pointer text-left",
                      isMenu
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/40",
                    )}
                  >
                    <span className="text-[15px] font-bold text-foreground">
                      En Menu
                    </span>
                    <span className="text-[13px] text-muted-foreground mt-1">
                      +{formatPrice(MENU_UPGRADE_PRICE)} · frites + boisson
                    </span>
                    {isMenu && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-foreground flex items-center justify-center">
                        <Check className="h-3 w-3 text-background" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Menu sub-selectors — only shown when "En Menu" is active */}
                {isMenu && (
                  <>
                    {/* Fries selector */}
                    <div className="mt-8">
                      <div className="mb-1 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-[17px] font-bold text-foreground leading-tight">
                            🍟 Tes frites
                          </h3>
                          <p className="text-[13px] text-muted-foreground mt-0.5">
                            Choisir 1
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-[12px] font-medium text-foreground">
                          Obligatoire
                        </span>
                      </div>
                      <div className="mt-3 divide-y divide-border">
                        {menuOptions.fries.map((f) => {
                          const isSel = menuFriesSlug === f.slug;
                          return (
                            <button
                              key={f.slug}
                              type="button"
                              onClick={() => setMenuFriesSlug(f.slug)}
                              className="w-full flex items-center justify-between py-3.5 text-left cursor-pointer"
                            >
                              <span className="text-[15px] text-foreground">
                                {f.label}
                              </span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[13px] text-muted-foreground">
                                  {f.supplement > 0
                                    ? `+${formatPrice(f.supplement)}`
                                    : "incluses"}
                                </span>
                                <div
                                  className={cn(
                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                    isSel ? "border-foreground" : "border-border",
                                  )}
                                >
                                  {isSel && (
                                    <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Drink selector */}
                    <div className="mt-8">
                      <div className="mb-1 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-[17px] font-bold text-foreground leading-tight">
                            🥤 Ta boisson
                          </h3>
                          <p className="text-[13px] text-muted-foreground mt-0.5">
                            Choisir 1
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-[12px] font-medium text-foreground">
                          Obligatoire
                        </span>
                      </div>
                      <div className="mt-3 divide-y divide-border">
                        {menuOptions.drinks.map((d) => {
                          const isSel = menuDrinkId === d.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setMenuDrinkId(d.id)}
                              className="w-full flex items-center justify-between py-3.5 text-left cursor-pointer"
                            >
                              <span className="text-[15px] text-foreground">
                                {d.name}
                              </span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[13px] text-muted-foreground">
                                  {d.supplement > 0
                                    ? `+${formatPrice(d.supplement)}`
                                    : "incluse"}
                                </span>
                                <div
                                  className={cn(
                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                    isSel ? "border-foreground" : "border-border",
                                  )}
                                >
                                  {isSel && (
                                    <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

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
                        {v.price_modifier !== 0 && (
                          <span className="text-[13px] text-muted-foreground">
                            {v.price_modifier > 0 ? "+" : "-"}{formatPrice(Math.abs(v.price_modifier))}
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
            {visibleExtraGroups.map((group) => {
              const groupSelectedCount = group.items.reduce(
                (sum, i) => sum + (selectedExtras.get(i.id) || 0),
                0
              );
              const unbounded = isUnbounded(group);
              const effectiveMax =
                !unbounded && group.max_selections !== null
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
                      const extraQty = selectedExtras.get(extra.id) || 0;
                      const isDisabled =
                        !extra.is_available || (atMax && !isSelected);

                      {/* Unbounded groups → quantity stepper */}
                      if (unbounded && !isSingleSelect) {
                        return (
                          <div
                            key={extra.id}
                            className={cn(
                              "flex items-center justify-between py-3.5",
                              !extra.is_available && "opacity-40"
                            )}
                          >
                            <div>
                              <span className="text-[15px] text-foreground">
                                {extra.name}
                              </span>
                              {extra.price > 0 && (
                                <span className="text-[13px] text-muted-foreground ml-2">
                                  +{formatPrice(extra.price)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {extraQty > 0 && (
                                <button
                                  onClick={() => setExtraQty(extra.id, extraQty - 1)}
                                  disabled={!extra.is_available}
                                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <Minus className="h-3.5 w-3.5 text-foreground" />
                                </button>
                              )}
                              {extraQty > 0 && (
                                <span className="w-7 text-center text-sm font-semibold tabular-nums text-foreground">
                                  {extraQty}
                                </span>
                              )}
                              <button
                                onClick={() => setExtraQty(extra.id, extraQty + 1)}
                                disabled={!extra.is_available}
                                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
                              >
                                <Plus className="h-3.5 w-3.5 text-foreground" />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      {/* Bounded groups → checkbox / radio toggle */}
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
                  onClick={() => setQuantity(Math.min(50, quantity + 1))}
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
