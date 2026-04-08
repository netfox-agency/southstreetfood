"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PriceDisplay } from "@/components/shared/price-display";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const {
    items,
    orderType,
    customerNotes,
    setOrderType,
    updateQuantity,
    removeItem,
    setCustomerNotes,
    subtotal,
  } = useCartStore();

  const deliveryFee = orderType === "delivery" ? 350 : 0; // 3.50 EUR flat - will be dynamic
  const total = subtotal() + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Votre panier est vide
        </h1>
        <p className="text-muted-foreground mb-6">
          Ajoutez des articles depuis notre menu
        </p>
        <Link href="/menu">
          <Button>Voir le menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Continuer vos achats
        </Link>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-8">
          Votre panier
        </h1>

        {/* Order type toggle */}
        <div className="mb-8">
          <h2 className="font-semibold text-foreground mb-3">
            Mode de commande
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOrderType("collect")}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                orderType === "collect"
                  ? "border-brand-purple bg-accent"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <MapPin
                className={cn(
                  "h-5 w-5",
                  orderType === "collect"
                    ? "text-brand-purple"
                    : "text-muted-foreground"
                )}
              />
              <div className="text-left">
                <div className="font-medium text-sm">A emporter</div>
                <div className="text-xs text-muted-foreground">
                  Recuperez au restaurant
                </div>
              </div>
            </button>
            <button
              onClick={() => setOrderType("delivery")}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                orderType === "delivery"
                  ? "border-brand-purple bg-accent"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <Clock
                className={cn(
                  "h-5 w-5",
                  orderType === "delivery"
                    ? "text-brand-purple"
                    : "text-muted-foreground"
                )}
              />
              <div className="text-left">
                <div className="font-medium text-sm">Livraison</div>
                <div className="text-xs text-muted-foreground">
                  Zone BAB - {formatPrice(deliveryFee)}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Delivery address form */}
        {orderType === "delivery" && (
          <div className="mb-8 p-5 rounded-2xl border border-border bg-card space-y-4">
            <h2 className="font-semibold text-foreground">
              Adresse de livraison
            </h2>
            <Input
              label="Adresse"
              placeholder="12 rue de la Republique"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ville" placeholder="Bayonne" />
              <Input label="Code postal" placeholder="64100" />
            </div>
            <Textarea
              label="Instructions de livraison"
              placeholder="Code porte, etage, etc."
            />
          </div>
        )}

        {/* Cart items */}
        <div className="mb-8 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-2xl border border-border bg-card"
            >
              {/* Image placeholder */}
              <div className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-brand-purple-subtle to-muted flex items-center justify-center text-2xl">
                🍔
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {item.menuItemName}
                    </h3>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground">
                        {item.variantName}
                      </p>
                    )}
                    {item.extras.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        +{" "}
                        {item.extras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-muted rounded-lg p-0.5">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-background transition-colors cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-background transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <PriceDisplay
                    cents={
                      (item.unitPrice + item.extrasPrice) * item.quantity
                    }
                    size="sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mb-8">
          <Textarea
            label="Notes pour le restaurant"
            placeholder="Instructions speciales, allergies, etc."
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
          />
        </div>

        {/* Price summary */}
        <div className="mb-6 p-5 rounded-2xl bg-muted/50 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <PriceDisplay cents={subtotal()} size="sm" />
          </div>
          {orderType === "delivery" && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frais de livraison</span>
              <PriceDisplay cents={deliveryFee} size="sm" />
            </div>
          )}
          <div className="h-px bg-border" />
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <PriceDisplay cents={total} size="lg" />
          </div>
        </div>

        {/* Checkout button */}
        <Link href="/checkout">
          <Button size="lg" className="w-full">
            Passer la commande - {formatPrice(total)}
          </Button>
        </Link>
      </div>
    </div>
  );
}
