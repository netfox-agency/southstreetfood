"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/shared/price-display";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { items, orderType, subtotal, clear } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const deliveryFee = orderType === "delivery" ? 350 : 0;
  const total = subtotal() + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Panier vide
        </h1>
        <Link href="/menu">
          <Button>Retour au menu</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);

    // TODO: Create order via API, then create Stripe PaymentIntent
    // For now, simulate success
    await new Promise((r) => setTimeout(r, 2000));

    clear();
    toast.success("Commande envoyee !");

    // TODO: Redirect to /order/confirmation/[id]
    window.location.href = "/order/confirmation/demo";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au panier
        </Link>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-8">
          Finaliser la commande
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer info */}
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">
              Vos informations
            </h2>
            <Input
              label="Nom complet *"
              placeholder="Jean Dupont"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <Input
              label="Telephone *"
              type="tel"
              placeholder="06 12 34 56 78"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
            <Input
              label="Email (optionnel)"
              type="email"
              placeholder="jean@exemple.fr"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          {/* Order summary */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-foreground mb-3">
              Recapitulatif
            </h2>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {item.quantity}x {item.menuItemName}
                  {item.variantName && ` (${item.variantName})`}
                </span>
                <PriceDisplay
                  cents={
                    (item.unitPrice + item.extrasPrice) * item.quantity
                  }
                  size="sm"
                />
              </div>
            ))}
            {orderType === "delivery" && (
              <>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Frais de livraison
                  </span>
                  <PriceDisplay cents={deliveryFee} size="sm" />
                </div>
              </>
            )}
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <PriceDisplay cents={total} size="lg" />
            </div>
          </div>

          {/* Stripe Payment Element placeholder */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Paiement securise
            </h2>
            <div className="rounded-xl bg-muted p-8 text-center text-muted-foreground">
              <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">
                Stripe Payment Element
              </p>
              <p className="text-xs mt-1">
                Carte bancaire, Apple Pay, Google Pay
              </p>
              <p className="text-xs text-brand-purple mt-2">
                Se connectera une fois les cles Stripe configurees
              </p>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
          >
            <Lock className="h-4 w-4" />
            Payer {formatPrice(total)}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Paiement securise par Stripe. Vos donnees bancaires ne sont
            jamais stockees sur nos serveurs.
          </p>
        </form>
      </div>
    </div>
  );
}
