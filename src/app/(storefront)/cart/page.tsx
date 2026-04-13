"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2, MapPin, Truck, UtensilsCrossed, ShoppingBag, Store, Clock } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    items,
    orderType,
    customerNotes,
    deliveryAddress,
    setOrderType,
    setDeliveryAddress,
    updateQuantity,
    removeItem,
    setCustomerNotes,
    subtotal,
  } = useCartStore();

  const { settings } = useRestaurantSettings();

  const deliveryFee = orderType === "delivery" ? settings.baseDeliveryFee : 0;
  const currentSubtotal = subtotal();
  const total = currentSubtotal + deliveryFee;

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)} \u20ac`;
  const belowMin =
    orderType === "delivery" &&
    settings.minOrderDelivery > 0 &&
    currentSubtotal < settings.minOrderDelivery;
  const missing = belowMin ? settings.minOrderDelivery - currentSubtotal : 0;

  // Hydration guard: show loading state until client-side store is hydrated
  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-[#1d1d1f]/20 border-t-[#1d1d1f] rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-5">
        <ShoppingBag className="h-12 w-12 text-[#d1d1d6] mb-4" />
        <h1 className="text-xl font-bold text-[#1d1d1f] mb-2">Votre panier est vide</h1>
        <p className="text-[#86868b] text-sm mb-6">Ajoutez des articles depuis notre menu</p>
        <Link
          href="/menu"
          className="px-6 py-3 bg-[#1d1d1f] text-white rounded-xl text-sm font-semibold hover:bg-[#1d1d1f]/90 transition-colors"
        >
          Voir le menu
        </Link>
      </div>
    );
  }

  const orderTypes = [
    { key: "dine_in" as const, label: "Sur place", sub: "Au restaurant", icon: Store, enabled: true },
    { key: "collect" as const, label: "A emporter", sub: "Click & Collect", icon: MapPin, enabled: settings.collectEnabled },
    { key: "delivery" as const, label: "Livraison", sub: `BAB · ${formatPrice(settings.baseDeliveryFee)}`, icon: Truck, enabled: settings.deliveryEnabled },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-lg px-5 py-8">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Continuer vos achats
        </Link>

        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-6">
          Votre panier
        </h1>

        {/* Order type */}
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">Mode de commande</h2>
          <div className="grid grid-cols-3 gap-2">
            {orderTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => type.enabled && setOrderType(type.key)}
                disabled={!type.enabled}
                className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                  !type.enabled
                    ? "border-[#e5e5ea] opacity-40 cursor-not-allowed"
                    : orderType === type.key
                    ? "border-[#1d1d1f] bg-[#1d1d1f]/[0.03] cursor-pointer"
                    : "border-[#e5e5ea] hover:border-[#c7c7cc] cursor-pointer"
                }`}
              >
                <type.icon className={`h-5 w-5 shrink-0 ${orderType === type.key ? "text-[#1d1d1f]" : "text-[#86868b]"}`} />
                <div>
                  <div className="font-medium text-sm text-[#1d1d1f] leading-tight">
                    {type.label}
                    {!type.enabled && <span className="text-[10px] text-[#aeaeb2] block">Indisponible</span>}
                  </div>
                  <div className="text-[11px] text-[#86868b] mt-0.5">{type.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery address */}
        {orderType === "delivery" && (
          <div className="mb-5 bg-white rounded-2xl border border-[#e5e5ea] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#1d1d1f]">Adresse de livraison</h2>
            <input
              type="text"
              placeholder="12 rue de la Republique"
              value={deliveryAddress?.street || ""}
              onChange={(e) => setDeliveryAddress({
                street: e.target.value,
                city: deliveryAddress?.city || "",
                postalCode: deliveryAddress?.postalCode || "",
                instructions: deliveryAddress?.instructions,
              })}
              className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Bayonne"
                value={deliveryAddress?.city || ""}
                onChange={(e) => setDeliveryAddress({
                  street: deliveryAddress?.street || "",
                  city: e.target.value,
                  postalCode: deliveryAddress?.postalCode || "",
                  instructions: deliveryAddress?.instructions,
                })}
                className="h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all"
              />
              <input
                type="text"
                placeholder="64100"
                value={deliveryAddress?.postalCode || ""}
                onChange={(e) => setDeliveryAddress({
                  street: deliveryAddress?.street || "",
                  city: deliveryAddress?.city || "",
                  postalCode: e.target.value,
                  instructions: deliveryAddress?.instructions,
                })}
                className="h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all"
              />
            </div>
            <input
              type="text"
              placeholder="Instructions (code, etage...)"
              value={deliveryAddress?.instructions || ""}
              onChange={(e) => setDeliveryAddress({
                street: deliveryAddress?.street || "",
                city: deliveryAddress?.city || "",
                postalCode: deliveryAddress?.postalCode || "",
                instructions: e.target.value,
              })}
              className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all"
            />
          </div>
        )}

        {/* Cart items */}
        <div className="mb-5 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 p-4 bg-white rounded-2xl border border-[#e5e5ea]"
            >
              {/* Item image */}
              <div className="h-14 w-14 shrink-0 rounded-xl bg-[#f5f5f7] flex items-center justify-center overflow-hidden">
                {item.menuItemImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.menuItemImage} alt={item.menuItemName} className="h-full w-full object-cover" />
                ) : (
                  <UtensilsCrossed className="h-5 w-5 text-[#c7c7cc]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1d1d1f]">
                      {item.menuItemName}
                    </h3>
                    {item.variantName && (
                      <p className="text-xs text-[#86868b]">{item.variantName}</p>
                    )}
                    {item.extras.length > 0 && (
                      <p className="text-xs text-[#86868b] mt-0.5">
                        + {item.extras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[#aeaeb2] hover:text-red-500 transition-colors cursor-pointer p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-[#f5f5f7] rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                    >
                      <Minus className="h-3 w-3 text-[#1d1d1f]" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium tabular-nums text-[#1d1d1f]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-[#1d1d1f]" />
                    </button>
                  </div>
                  <span className="font-semibold text-sm text-[#1d1d1f] tabular-nums">
                    {formatPrice((item.unitPrice + item.extrasPrice) * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mb-5">
          <textarea
            placeholder="Notes pour le restaurant (allergies, instructions...)"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all resize-none"
          />
        </div>

        {/* Price summary */}
        <div className="mb-5 p-5 bg-white rounded-2xl border border-[#e5e5ea] space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-[#86868b]">Sous-total</span>
            <span className="text-[#1d1d1f] tabular-nums">{formatPrice(currentSubtotal)}</span>
          </div>
          {orderType === "delivery" && (
            <div className="flex justify-between text-sm">
              <span className="text-[#86868b]">Frais de livraison</span>
              <span className="text-[#1d1d1f] tabular-nums">{formatPrice(deliveryFee)}</span>
            </div>
          )}
          <div className="pt-2.5 border-t border-[#f0f0f2] flex justify-between">
            <span className="font-bold text-[#1d1d1f]">Total</span>
            <span className="font-bold text-lg text-[#1d1d1f] tabular-nums">{formatPrice(total)}</span>
          </div>
          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#86868b]">
            <Clock className="h-3 w-3" />
            <span>
              Prêt en ~{settings.estimatedPrepMinutes} min
              {orderType === "delivery" && " + livraison"}
            </span>
          </div>
        </div>

        {/* Min order warning */}
        {belowMin && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            <strong className="font-semibold">Minimum {formatPrice(settings.minOrderDelivery)}</strong> pour la livraison.
            {" "}Ajoutez encore <strong className="font-semibold tabular-nums">{formatPrice(missing)}</strong>.
          </div>
        )}

        {/* Checkout button */}
        {belowMin ? (
          <button
            disabled
            className="block w-full h-13 rounded-2xl bg-[#1d1d1f] text-white font-semibold text-[15px] text-center leading-[3.25rem] opacity-30 cursor-not-allowed"
          >
            Passer la commande &middot; {formatPrice(total)}
          </button>
        ) : (
          <Link
            href="/checkout"
            className="block w-full h-13 rounded-2xl bg-[#1d1d1f] text-white font-semibold text-[15px] hover:bg-[#1d1d1f]/90 transition-colors text-center leading-[3.25rem]"
          >
            Passer la commande &middot; {formatPrice(total)}
          </Link>
        )}
      </div>
    </div>
  );
}
