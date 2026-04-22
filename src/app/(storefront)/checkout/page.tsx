"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, ShoppingBag, MapPin, Truck, Check, Star } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { getDeliveryFeeForCity } from "@/lib/constants";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    items, orderType, deliveryAddress, customerNotes, subtotal, clear,
    customerName, customerPhone, customerEmail, loyaltyRewardId,
    setCustomerName, setCustomerPhone, setCustomerEmail,
  } = useCartStore();
  const { settings } = useRestaurantSettings();
  const [loading, setLoading] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [loyaltyOrders, setLoyaltyOrders] = useState(0);

  // Fetch loyalty balance when phone is valid
  useEffect(() => {
    const phone = customerPhone.replace(/\s/g, "");
    if (phone.length < 10) {
      setLoyaltyPoints(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/loyalty/balance?phone=${encodeURIComponent(customerPhone.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setLoyaltyPoints(data.totalPoints || 0);
          setLoyaltyOrders(data.totalOrders || 0);
        }
      } catch {
        // silent
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [customerPhone]);

  const cityFee = deliveryAddress?.city ? getDeliveryFeeForCity(deliveryAddress.city) : null;
  const deliveryFee = orderType === "delivery" && cityFee !== null ? cityFee : 0;
  const total = subtotal() + deliveryFee;

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)} \u20ac`;

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-[#1d1d1f]/20 border-t-[#1d1d1f] rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0 || !orderType) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-5">
        <ShoppingBag className="h-12 w-12 text-[#d1d1d6] mb-4" />
        <h1 className="text-xl font-bold text-[#1d1d1f] mb-2">{!orderType ? "Mode de commande requis" : "Panier vide"}</h1>
        <Link href={!orderType ? "/cart" : "/menu"} className="text-sm text-[#86868b] underline">
          {!orderType ? "Retour au panier" : "Retour au menu"}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Remplissez votre nom et telephone");
      return;
    }

    if (customerPhone.replace(/\s/g, "").length < 10) {
      toast.error("Numero de telephone invalide");
      return;
    }

    if (orderType === "delivery" && (!deliveryAddress?.street || !deliveryAddress?.city)) {
      toast.error("Remplissez l'adresse de livraison dans le panier");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        orderType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        notes: customerNotes || undefined,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          extrasPrice: item.extrasPrice,
          itemName: item.menuItemName,
          variantName: item.variantName,
          extras: item.extras,
          specialInstructions: item.specialInstructions,
        })),
        deliveryAddress: orderType === "delivery" && deliveryAddress ? {
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          postalCode: deliveryAddress.postalCode,
          lat: deliveryAddress.lat,
          lng: deliveryAddress.lng,
          instructions: deliveryAddress.instructions,
        } : null,
        loyaltyRewardId: loyaltyRewardId || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erreur lors de la commande");
      }

      clear();
      toast.success("Commande envoyee !");
      router.push(`/order/confirmation/${result.orderId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la commande";
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-lg px-5 py-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au panier
        </Link>

        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-6">
          Finaliser la commande
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 space-y-4">
            <h2 className="font-semibold text-[15px] text-[#1d1d1f]">Vos informations</h2>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
                <User className="h-4 w-4 text-[#86868b]" />
                Nom complet
              </label>
              <input
                type="text"
                placeholder="Jean Dupont"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
                <Phone className="h-4 w-4 text-[#86868b]" />
                Telephone
              </label>
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
              />
              {/* Loyalty badge */}
              {loyaltyPoints !== null && loyaltyPoints > 0 && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                  <Star className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-amber-800">
                      {loyaltyPoints} points
                    </span>
                    <span className="text-amber-600">
                      {" "}· {loyaltyOrders} commande{loyaltyOrders > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
              {loyaltyPoints === 0 && loyaltyOrders === 0 && customerPhone.replace(/\s/g, "").length >= 10 && (
                <p className="mt-1.5 text-xs text-[#86868b] flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Premiere commande ? Gagnez des points fidelite !
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
                <Mail className="h-4 w-4 text-[#86868b]" />
                Email <span className="text-[#aeaeb2] font-normal">(optionnel)</span>
              </label>
              <input
                type="email"
                placeholder="jean@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
              />
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
            <h2 className="font-semibold text-[15px] text-[#1d1d1f] mb-4">Recapitulatif</h2>

            {/* Order type + delivery address */}
            <div className="mb-4 pb-4 border-b border-[#f0f0f2]">
              <div className="flex items-center gap-2 text-sm text-[#86868b]">
                {orderType === "delivery" && (
                  <>
                    <Truck className="h-4 w-4" />
                    <span>Livraison</span>
                  </>
                )}
                {orderType === "collect" && (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>A emporter</span>
                  </>
                )}
              </div>
              {orderType === "delivery" && deliveryAddress?.street && (
                <div className="mt-2 ml-6 text-sm text-[#1d1d1f]">
                  <p>{deliveryAddress.street}</p>
                  <p className="text-[#86868b]">
                    {deliveryAddress.postalCode} {deliveryAddress.city}
                  </p>
                  {deliveryAddress.instructions && (
                    <p className="text-xs text-[#aeaeb2] italic mt-0.5">
                      {deliveryAddress.instructions}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2.5 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[#1d1d1f]">
                    <span className="text-[#86868b]">{item.quantity}x</span>{" "}
                    {item.menuItemName}
                    {item.variantName && <span className="text-[#aeaeb2]"> ({item.variantName})</span>}
                  </span>
                  <span className="font-medium text-[#1d1d1f] tabular-nums">
                    {formatPrice((item.unitPrice + item.extrasPrice) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#f0f0f2] pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#86868b]">Sous-total</span>
                <span className="text-[#1d1d1f] tabular-nums">{formatPrice(subtotal())}</span>
              </div>
              {orderType === "delivery" && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#86868b]">Frais de livraison</span>
                  <span className="text-[#1d1d1f] tabular-nums">{formatPrice(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#f0f0f2]">
                <span className="font-bold text-[#1d1d1f]">Total</span>
                <span className="font-bold text-lg text-[#1d1d1f] tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment note */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">Paiement sur place</p>
              <p className="text-[13px] text-[#86868b]">
                {orderType === "delivery" && "Vous payez à la réception de votre commande"}
                {orderType === "collect" && "Vous payez au comptoir lors du retrait"}
              </p>
            </div>
          </div>

          {/* Loyalty points preview */}
          {Math.floor(total / 100) > 0 && (
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-4 flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1d1d1f]">
                  +{Math.floor(total / 100) * 10} points fidelite
                </p>
                <p className="text-[13px] text-[#86868b]">
                  Credites apres validation de votre commande
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 rounded-2xl bg-[#1d1d1f] text-white font-semibold text-[15px] hover:bg-[#1d1d1f]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Envoyer la commande &middot; {formatPrice(total)}
              </>
            )}
          </button>

          <p className="text-xs text-center text-[#aeaeb2]">
            Votre commande sera envoyee directement en cuisine
          </p>
        </form>
      </div>
    </div>
  );
}
