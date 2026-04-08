"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Demo data - will be replaced by Supabase fetch
const DEMO_ITEM = {
  id: "1",
  category_id: "cat-1",
  name: "Le Classic Smash",
  slug: "le-classic-smash",
  description:
    "Notre burger signature: double smash patty bien grille, cheddar americain fondu, sauce maison secrete, oignons caramelises, pickles croquants. Servi dans un pain broche toaste.",
  base_price: 990,
  image_url: null,
  is_available: true,
  is_featured: true,
  display_order: 1,
  allergens: ["Gluten", "Lait", "Oeuf"],
  created_at: "",
  updated_at: "",
  category: {
    id: "cat-1",
    name: "Burgers",
    slug: "burgers",
    description: null,
    display_order: 1,
    image_url: null,
    is_active: true,
    created_at: "",
  },
  variants: [
    { id: "v1", menu_item_id: "1", name: "Seul", price_modifier: 0, is_default: true, is_available: true },
    { id: "v2", menu_item_id: "1", name: "Menu (Frites + Boisson)", price_modifier: 350, is_default: false, is_available: true },
  ],
  extra_groups: [
    {
      id: "eg1",
      name: "Sauces supplementaires",
      min_selections: 0,
      max_selections: 3,
      display_order: 1,
      items: [
        { id: "e1", extra_group_id: "eg1", name: "Sauce Ketchup", price: 0, is_available: true, display_order: 1 },
        { id: "e2", extra_group_id: "eg1", name: "Sauce Mayo", price: 0, is_available: true, display_order: 2 },
        { id: "e3", extra_group_id: "eg1", name: "Sauce Barbecue", price: 50, is_available: true, display_order: 3 },
        { id: "e4", extra_group_id: "eg1", name: "Sauce Samourai", price: 50, is_available: true, display_order: 4 },
      ],
    },
    {
      id: "eg2",
      name: "Supplements",
      min_selections: 0,
      max_selections: 5,
      display_order: 2,
      items: [
        { id: "e5", extra_group_id: "eg2", name: "Cheddar supplementaire", price: 100, is_available: true, display_order: 1 },
        { id: "e6", extra_group_id: "eg2", name: "Bacon", price: 150, is_available: true, display_order: 2 },
        { id: "e7", extra_group_id: "eg2", name: "Oeuf au plat", price: 100, is_available: true, display_order: 3 },
        { id: "e8", extra_group_id: "eg2", name: "Jalapenos", price: 50, is_available: true, display_order: 4 },
      ],
    },
  ],
};

export default function ItemDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const item = DEMO_ITEM; // Will fetch by slug from Supabase

  const [selectedVariant, setSelectedVariant] = useState(
    item.variants.find((v) => v.is_default) || item.variants[0]
  );
  const [selectedExtras, setSelectedExtras] = useState<Map<string, boolean>>(new Map());
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      const next = new Map(prev);
      if (next.has(extraId)) {
        next.delete(extraId);
      } else {
        next.set(extraId, true);
      }
      return next;
    });
  };

  const selectedExtrasList = item.extra_groups.flatMap((g) =>
    g.items.filter((e) => selectedExtras.has(e.id))
  );

  const extrasTotal = selectedExtrasList.reduce((sum, e) => sum + e.price, 0);
  const unitPrice = item.base_price + (selectedVariant?.price_modifier || 0);
  const lineTotal = (unitPrice + extrasTotal) * quantity;

  const handleAddToCart = () => {
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au menu
        </Link>

        {/* Product image */}
        <div className="relative aspect-[16/10] rounded-2xl bg-gradient-to-br from-brand-purple-subtle to-muted overflow-hidden mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl">🍔</span>
          </div>
          {item.is_featured && (
            <Badge className="absolute top-4 left-4 bg-brand-yellow text-black">
              Populaire
            </Badge>
          )}
        </div>

        {/* Product info */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-brand-purple font-medium mb-1">
                {item.category.name}
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {item.name}
              </h1>
            </div>
            <PriceDisplay cents={item.base_price} size="lg" />
          </div>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {item.description}
          </p>
          {item.allergens && item.allergens.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs text-muted-foreground">
                Allergenes : {item.allergens.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Variants */}
        {item.variants.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-foreground mb-3">Formule</h2>
            <div className="flex gap-3">
              {item.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer",
                    selectedVariant?.id === variant.id
                      ? "border-brand-purple bg-accent text-brand-purple"
                      : "border-border hover:border-muted-foreground text-foreground"
                  )}
                >
                  <div>{variant.name}</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">
                    {variant.price_modifier === 0
                      ? "Inclus"
                      : `+${(variant.price_modifier / 100).toFixed(2)} \u20ac`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Extra groups */}
        {item.extra_groups.map((group) => (
          <div key={group.id} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">{group.name}</h2>
              {group.max_selections && (
                <span className="text-xs text-muted-foreground">
                  Max {group.max_selections}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {group.items.map((extra) => {
                const isSelected = selectedExtras.has(extra.id);
                return (
                  <button
                    key={extra.id}
                    onClick={() => toggleExtra(extra.id)}
                    disabled={!extra.is_available}
                    className={cn(
                      "w-full flex items-center justify-between py-3 px-4 rounded-xl border transition-all cursor-pointer",
                      isSelected
                        ? "border-brand-purple bg-accent"
                        : "border-border hover:border-muted-foreground",
                      !extra.is_available && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-brand-purple border-brand-purple"
                            : "border-border"
                        )}
                      >
                        {isSelected && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {extra.name}
                      </span>
                    </div>
                    {extra.price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        +{(extra.price / 100).toFixed(2)} &euro;
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quantity + Add to Cart (sticky bottom) */}
        <div className="sticky bottom-0 bg-background/90 backdrop-blur-lg border-t border-border -mx-4 px-4 py-4 sm:mx-0 sm:px-0 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
          <div className="flex items-center gap-4">
            {/* Quantity */}
            <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
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

            {/* Add button */}
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" />
              Ajouter
              <span className="ml-1">
                {(lineTotal / 100).toFixed(2)} &euro;
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
