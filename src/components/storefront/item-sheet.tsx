"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Minus, Plus, AlertTriangle, Check } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MENU_UPGRADE_PRICE } from "@/lib/constants";

/* ───────── types ───────── */

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
  /** Bundled by /api/menu/[slug] — true when item can be upgraded "en Menu". */
  isMenuEligible?: boolean;
  /** Bundled by /api/menu/[slug] — only present when isMenuEligible. */
  menuOptions?: MenuOptions | null;
}

/* ───────── helpers ───────── */

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " \u20ac";
}

function groupSubtitle(g: ExtraGroup): string {
  const { min_selections: min, max_selections: max } = g;
  const unbounded = max === null || max >= 999;
  if (min === 1 && max === 1) return "Choisir 1";
  if (min === 0 && max === 1) return "Choisir 1 max";
  if (min > 0 && !unbounded && max === min) return `Choisir ${min}`;
  if (min > 0 && !unbounded) return `Choisir entre ${min} et ${max}`;
  if (min === 0 && !unbounded) return `Choisir jusqu'a ${max} max`;
  if (min > 0 && unbounded) return `Min ${min}`;
  return "Choisir";
}

/* ───────── skeleton ───────── */

function SheetSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/10] bg-muted rounded-t-none" />
      <div className="px-5 py-6 space-y-6">
        <div>
          <div className="h-7 w-48 bg-muted rounded-lg mb-2" />
          <div className="h-6 w-24 bg-muted rounded-lg mb-3" />
          <div className="h-4 w-full bg-muted rounded mb-1" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
        {[1, 2, 3].map((g) => (
          <div key={g} className="pt-5 border-t border-border">
            <div className="h-5 w-40 bg-muted rounded mb-1" />
            <div className="h-3 w-20 bg-muted rounded mb-3" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between py-3">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-5 w-5 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── main component ───────── */

export function ItemSheet({
  slug,
  previewData,
  onClose,
}: {
  slug: string;
  /** Partial data from the menu card — shows instantly while full data loads */
  previewData: {
    name: string;
    base_price: number;
    image_url: string | null;
    description: string | null;
  };
  onClose: () => void;
}) {
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Map<string, number>>(new Map());
  const [quantity, setQuantity] = useState(1);
  const [visible, setVisible] = useState(false);
  // ── Menu (formule) state ──
  const [isMenu, setIsMenu] = useState(false);
  const [menuDrinkId, setMenuDrinkId] = useState<string | null>(null);
  const [menuFriesSlug, setMenuFriesSlug] = useState<string | null>(null);
  // Visual flash when the customer skips a required Menu field — replaces
  // the toast. Values: "fries" | "drink" | null.
  const [flashField, setFlashField] = useState<"fries" | "drink" | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const friesSectionRef = useRef<HTMLDivElement>(null);
  const drinkSectionRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  // Slide-in animation
  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Fetch full item data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/menu/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        if (cancelled) return;
        setItem(data);
        setSelectedVariant(
          data.variants.find((v: Variant) => v.is_default && v.is_available) ||
            data.variants.find((v: Variant) => v.is_available) ||
            null
        );
        // Default fries to the first option (salées, included) so the customer
        // only has to pick a drink to validate the menu.
        if (data.menuOptions?.fries?.[0]?.slug) {
          setMenuFriesSlug(data.menuOptions.fries[0].slug);
        }
      } catch {
        toast.error("Impossible de charger l'article");
        handleClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300); // wait for slide-out
  }, [onClose]);

  // When the customer flips the Menu switch OFF, wipe the drink choice so
  // re-enabling later doesn't silently re-use a stale pick. Fries stays set
  // to the default (salées) — that's always a safe default.
  useEffect(() => {
    if (!isMenu) setMenuDrinkId(null);
  }, [isMenu]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  const isUnbounded = (group: ExtraGroup) =>
    group.max_selections === null || group.max_selections >= 999;

  /**
   * Hide drink/fries extra groups when "En Menu" is active — those choices
   * are covered by the dedicated menu selectors below, no point asking twice.
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

  const visibleExtraGroups = item
    ? item.extra_groups.filter((g) => !isHiddenByMenu(g))
    : [];

  const toggleExtra = (extraId: string, groupId: string) => {
    if (!item) return;
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
          const count = group.items.filter((i) => next.has(i.id)).length;
          if (count >= group.max_selections) return prev;
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

  // Build flat list of extras with quantities expanded for cart — only from
  // visible groups so a Menu pre-selection from the boissons/accomp groups
  // doesn't leak into the price.
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
  const menuOptions = item?.menuOptions ?? null;
  const isMenuEligible = !!item?.isMenuEligible;
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

  const unitPrice =
    (item?.base_price ?? previewData.base_price) + variantMod + menuTotal;
  const lineTotal = (unitPrice + extrasTotal) * quantity;

  const handleAddToCart = () => {
    if (!item) return;

    // Validate only visible groups — drink/fries groups are hidden when
    // En Menu is on, and replaced by the dedicated menu selectors.
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
    // Instead of a toast (easy to miss on mobile, requires reading), we
    // scroll the missing section into view and flash it red for ~1.5s.
    // The customer's eye is dragged straight to what's missing.
    if (isMenu) {
      const flashAndScroll = (
        target: "fries" | "drink",
        ref: React.RefObject<HTMLDivElement | null>,
      ) => {
        setFlashField(target);
        ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setFlashField(null), 1500);
      };
      if (!selectedFries) {
        flashAndScroll("fries", friesSectionRef);
        return;
      }
      if (!selectedDrink) {
        flashAndScroll("drink", drinkSectionRef);
        return;
      }
    }

    // Prepend virtual fries/drink rows so the cart and kitchen ticket
    // show exactly what the customer chose. Price is 0 because supplements
    // are baked into unitPrice via menuTotal — don't double-count.
    const allExtras = [...selectedExtrasList];
    if (isMenu && selectedFries && selectedDrink) {
      allExtras.unshift(
        {
          id: `menu-fries-${selectedFries.slug}`,
          name: `🍟 ${selectedFries.label}${selectedFries.supplement > 0 ? "" : " (incluses)"}`,
          price: 0,
        } as ExtraItem,
        {
          id: `menu-drink-${selectedDrink.id}`,
          name: `🥤 ${selectedDrink.name}${selectedDrink.supplement > 0 ? "" : " (incluse)"}`,
          price: 0,
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
    handleClose();
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300",
        visible ? "bg-black/50" : "bg-black/0"
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full max-w-lg bg-background rounded-t-3xl transition-transform duration-300 ease-out flex flex-col",
          "max-h-[92vh]",
          visible ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* ── Close button ── */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/5 backdrop-blur-sm flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        {/* ── Scrollable content ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Image — always visible instantly from preview data */}
          <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden rounded-t-3xl">
            {previewData.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewData.image_url}
                alt={previewData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-muted to-background">
                🌮
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-5 py-6 pb-36">
            {/* Title — from preview, instant */}
            <div className="mb-6">
              {item && !item.is_available && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Cet article est actuellement indisponible
                </div>
              )}
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {previewData.name}
              </h2>
              <div className="mt-1 text-lg font-bold text-foreground">
                {formatPrice(unitPrice)}
              </div>
              {previewData.description && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {previewData.description}
                </p>
              )}
              {item?.is_featured && (
                <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-foreground">
                  #1 Le plus aime
                </div>
              )}
              {item?.allergens && item.allergens.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Allergenes : {item.allergens.join(", ")}
                </div>
              )}
            </div>

            {loading ? (
              <SheetSkeleton />
            ) : item ? (
              <>
                {/* Variants */}
                {item.variants.length > 1 && (
                  <div className="mb-6 pt-5 border-t border-border">
                    <div className="mb-1">
                      <h3 className="text-[15px] font-bold text-foreground">
                        Choisir une formule
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Choisir 1
                      </p>
                    </div>
                    <div className="mt-3 divide-y divide-border">
                      {item.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          disabled={!v.is_available}
                          className={cn(
                            "w-full flex items-center justify-between py-3.5 text-left cursor-pointer",
                            !v.is_available && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <span className="text-sm text-foreground">
                            {v.name}
                          </span>
                          <div className="flex items-center gap-3">
                            {v.price_modifier !== 0 && (
                              <span className="text-xs text-muted-foreground">
                                {v.price_modifier > 0 ? "+" : "-"}
                                {formatPrice(Math.abs(v.price_modifier))}
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
                    effectiveMax !== null &&
                    groupSelectedCount >= effectiveMax;
                  const isRequired = group.min_selections > 0;
                  const isSingleSelect = group.max_selections === 1;

                  return (
                    <div
                      key={group.id}
                      className="mb-6 pt-5 border-t border-border"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold text-foreground leading-tight">
                            {group.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {groupSubtitle(group)}
                          </p>
                        </div>
                        {isRequired && (
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                            Obligatoire
                          </span>
                        )}
                      </div>
                      <div className="mt-2 divide-y divide-border">
                        {group.items.map((extra) => {
                          const isSelected = selectedExtras.has(extra.id);
                          const extraQty = selectedExtras.get(extra.id) || 0;
                          const isDisabled =
                            !extra.is_available || (atMax && !isSelected);

                          // Unbounded groups → quantity stepper
                          if (unbounded && !isSingleSelect) {
                            return (
                              <div
                                key={extra.id}
                                className={cn(
                                  "flex items-center justify-between py-3",
                                  !extra.is_available && "opacity-40"
                                )}
                              >
                                <div>
                                  <span className="text-sm text-foreground">
                                    {extra.name}
                                  </span>
                                  {extra.price > 0 && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      +{formatPrice(extra.price)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {extraQty > 0 && (
                                    <button
                                      onClick={() =>
                                        setExtraQty(extra.id, extraQty - 1)
                                      }
                                      disabled={!extra.is_available}
                                      className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                    >
                                      <Minus className="h-3 w-3 text-foreground" />
                                    </button>
                                  )}
                                  {extraQty > 0 && (
                                    <span className="w-6 text-center text-sm font-semibold tabular-nums text-foreground">
                                      {extraQty}
                                    </span>
                                  )}
                                  <button
                                    onClick={() =>
                                      setExtraQty(extra.id, extraQty + 1)
                                    }
                                    disabled={!extra.is_available}
                                    className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    <Plus className="h-3 w-3 text-foreground" />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          // Bounded groups → checkbox / radio toggle
                          return (
                            <button
                              key={extra.id}
                              onClick={() =>
                                toggleExtra(extra.id, group.id)
                              }
                              disabled={isDisabled}
                              className={cn(
                                "w-full flex items-center justify-between py-3 text-left cursor-pointer transition-opacity",
                                isDisabled &&
                                  !isSelected &&
                                  "opacity-40 cursor-not-allowed"
                              )}
                            >
                              <span className="text-sm text-foreground">
                                {extra.name}
                              </span>
                              <div className="flex items-center gap-3 shrink-0">
                                {extra.price > 0 && (
                                  <span className="text-xs text-muted-foreground">
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

                {/* ═══ EN MENU UPSELL (McDo cashier pattern) ═══
                    Placed AFTER the customer has configured their item — this
                    is the "would you like fries with that?" moment. A single
                    iOS-style switch avoids the cognitive load of a 2-card
                    binary choice. Toggle ON → fries + drink selectors expand
                    inline right here, no layout jump, no modal. */}
                {isMenuEligible && menuOptions && (
                  <div className="mt-2 pt-5 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setIsMenu(!isMenu)}
                      aria-pressed={isMenu}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 p-4 rounded-2xl transition-colors cursor-pointer text-left",
                        isMenu
                          ? "bg-brand/5 border-2 border-brand"
                          : "bg-muted/60 border-2 border-transparent hover:bg-muted",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 text-2xl leading-none">
                          🍟🥤
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-foreground leading-tight">
                            Tu le veux en Menu ?
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Ajoute frites + boisson 33cl pour +
                            {formatPrice(MENU_UPGRADE_PRICE)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "shrink-0 relative w-11 h-6 rounded-full transition-colors",
                          isMenu ? "bg-brand" : "bg-border",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                            isMenu ? "translate-x-[22px]" : "translate-x-0.5",
                          )}
                        />
                      </div>
                    </button>

                    {/* Inline expand — max-height + opacity keeps layout
                        stable, no content pop. Fries/drink cards flash red
                        when the customer tries to add to cart without picking. */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-out",
                        isMenu
                          ? "max-h-[1200px] opacity-100 mt-4"
                          : "max-h-0 opacity-0",
                      )}
                    >
                      {/* Fries */}
                      <div
                        ref={friesSectionRef}
                        className={cn(
                          "rounded-2xl px-4 py-3 transition-all duration-300",
                          flashField === "fries"
                            ? "bg-red-50 ring-2 ring-red-400"
                            : "bg-transparent ring-0",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-bold text-foreground leading-tight">
                              🍟 Tes frites
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Choisir 1
                            </p>
                          </div>
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                            Obligatoire
                          </span>
                        </div>
                        <div className="mt-2 divide-y divide-border">
                          {menuOptions.fries.map((f) => {
                            const isSel = menuFriesSlug === f.slug;
                            return (
                              <button
                                key={f.slug}
                                type="button"
                                onClick={() => setMenuFriesSlug(f.slug)}
                                className="w-full flex items-center justify-between py-3 text-left cursor-pointer"
                              >
                                <span className="text-sm text-foreground">
                                  {f.label}
                                </span>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs text-muted-foreground">
                                    {f.supplement > 0
                                      ? `+${formatPrice(f.supplement)}`
                                      : "incluses"}
                                  </span>
                                  <div
                                    className={cn(
                                      "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                      isSel
                                        ? "border-foreground"
                                        : "border-border",
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

                      {/* Drink */}
                      <div
                        ref={drinkSectionRef}
                        className={cn(
                          "mt-3 rounded-2xl px-4 py-3 transition-all duration-300",
                          flashField === "drink"
                            ? "bg-red-50 ring-2 ring-red-400"
                            : "bg-transparent ring-0",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-bold text-foreground leading-tight">
                              🥤 Ta boisson
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Choisir 1
                            </p>
                          </div>
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                            Obligatoire
                          </span>
                        </div>
                        <div className="mt-2 divide-y divide-border">
                          {menuOptions.drinks.map((d) => {
                            const isSel = menuDrinkId === d.id;
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => setMenuDrinkId(d.id)}
                                className="w-full flex items-center justify-between py-3 text-left cursor-pointer"
                              >
                                <span className="text-sm text-foreground">
                                  {d.name}
                                </span>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs text-muted-foreground">
                                    {d.supplement > 0
                                      ? `+${formatPrice(d.supplement)}`
                                      : "incluse"}
                                  </span>
                                  <div
                                    className={cn(
                                      "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                      isSel
                                        ? "border-foreground"
                                        : "border-border",
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
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* ── Sticky bottom CTA ── */}
        <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4 rounded-b-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Diminuer"
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-background transition-colors cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-7 text-center font-semibold tabular-nums text-sm">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(50, quantity + 1))}
                aria-label="Augmenter"
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-background transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!item?.is_available || loading}
              className="flex-1 h-11 rounded-full bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  Ajouter {quantity} au panier &middot; {formatPrice(lineTotal)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
