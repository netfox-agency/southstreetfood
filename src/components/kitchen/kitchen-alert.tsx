"use client";

import { Bell, Volume2, Phone, MapPin } from "lucide-react";
import type { OrderWithItems } from "@/types/order";

/**
 * Alerte cuisine plein ecran — facon Uber Eats.
 *
 * Deux ecrans, par priorite :
 *
 * 1. GATE AUDIO (si !unlocked) : au demarrage du service, un ecran demande
 *    de taper pour activer le son. Indispensable : les navigateurs bloquent
 *    l'audio tant qu'il n'y a pas eu un geste utilisateur. Sans ce tap, le
 *    son ne sortirait jamais (c'etait le bug).
 *
 * 2. NOUVELLE COMMANDE (si pendingOrders.length > 0) : overlay rouge plein
 *    ecran, par-dessus tout, avec le nombre de commandes + apercu. Le son
 *    boucle en parallele (gere cote page). Le gros bouton "ACCEPTER" coupe
 *    le son et l'overlay.
 *
 * Purement additif : ne touche pas au board, au realtime ni a l'impression.
 */
export function KitchenAlert({
  unlocked,
  onUnlock,
  pendingOrders,
  onAcknowledge,
}: {
  unlocked: boolean;
  onUnlock: () => void;
  pendingOrders: OrderWithItems[];
  onAcknowledge: () => void;
}) {
  // ─── 1. Gate audio (avant tout) ───
  if (!unlocked) {
    return (
      <div
        className="fixed inset-0 z-[200] bg-[#1d1d1f] flex flex-col items-center justify-center text-center px-6 cursor-pointer"
        onClick={onUnlock}
        role="button"
        aria-label="Demarrer le service"
      >
        <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center mb-6 animate-pulse">
          <Volume2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-white font-bold text-2xl mb-2">
          Appuyez pour démarrer le service
        </h1>
        <p className="text-white/60 text-sm max-w-xs">
          Active le son des nouvelles commandes. À faire une fois en arrivant
          en cuisine.
        </p>
        <div className="mt-8 px-8 py-3 rounded-full bg-[#e8416f] text-white font-semibold">
          Activer le son
        </div>
      </div>
    );
  }

  // ─── 2. Alerte nouvelle(s) commande(s) ───
  if (pendingOrders.length === 0) return null;

  const count = pendingOrders.length;

  return (
    <div className="fixed inset-0 z-[200] bg-red-600 flex flex-col animate-[pulse_1.4s_ease-in-out_infinite]">
      <div className="flex-1 flex flex-col items-center justify-center px-5 overflow-y-auto py-8">
        <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-4 animate-bounce">
          <Bell className="h-8 w-8 text-white" />
        </div>
        <p className="text-white/80 font-semibold uppercase tracking-widest text-sm">
          {count > 1 ? `${count} nouvelles commandes` : "Nouvelle commande"}
        </p>
        <h1 className="text-white font-black text-5xl sm:text-6xl tabular-nums my-2">
          {count > 1 ? `×${count}` : `#${String(pendingOrders[0].order_number).padStart(4, "0")}`}
        </h1>

        {/* Apercu (jusqu'a 3 commandes) */}
        <div className="w-full max-w-md space-y-2 mt-4">
          {pendingOrders.slice(0, 3).map((o) => (
            <div
              key={o.id}
              className="bg-white/15 rounded-2xl px-4 py-3 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">
                  #{String(o.order_number).padStart(4, "0")} · {o.customer_name}
                </span>
                <span className="text-white/70 text-xs uppercase">
                  {o.order_type === "delivery" ? (
                    <MapPin className="inline h-3.5 w-3.5" />
                  ) : (
                    "À emporter"
                  )}
                </span>
              </div>
              <p className="text-white/80 text-sm mt-0.5 line-clamp-2">
                {o.order_items
                  .map((it) => `${it.quantity}× ${it.item_name}`)
                  .join(" · ")}
              </p>
              {o.customer_phone && (
                <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {o.customer_phone}
                </p>
              )}
            </div>
          ))}
          {count > 3 && (
            <p className="text-white/70 text-center text-sm">
              + {count - 3} autre{count - 3 > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Bouton acquittement — coupe le son + ferme l'overlay */}
      <div className="shrink-0 p-5 pb-8">
        <button
          onClick={onAcknowledge}
          className="w-full h-16 rounded-2xl bg-white text-red-600 font-black text-xl active:scale-[0.98] transition-transform shadow-2xl"
        >
          ACCEPTER · VU
        </button>
      </div>
    </div>
  );
}
