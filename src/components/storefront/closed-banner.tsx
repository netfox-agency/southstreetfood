"use client";

import { Clock, XCircle } from "lucide-react";
import { useRestaurantStatus } from "@/hooks/use-restaurant-status";

/**
 * Banner affiche en haut d'une page storefront quand le resto est
 * ferme aux commandes. Se rafraichit automatiquement via Realtime
 * (le client voit la transition sans refresh).
 *
 * Utilise sur /menu et /cart. Retourne null si resto ouvert (pas de
 * banner, pas d'espace reserve).
 */
export function ClosedBanner({ className = "" }: { className?: string }) {
  const { status, loading } = useRestaurantStatus();
  if (loading || !status || status.isOpen) return null;

  const isTemp = status.reason === "temporarily_closed";

  return (
    <div
      className={`w-full ${
        isTemp ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
      } border-b px-5 py-3 flex items-center gap-2.5 ${className}`}
    >
      {isTemp ? (
        <Clock className="h-4 w-4 text-amber-700 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-700 shrink-0" />
      )}
      <p
        className={`text-sm font-medium ${
          isTemp ? "text-amber-900" : "text-red-900"
        }`}
      >
        {status.message}
      </p>
    </div>
  );
}

/**
 * Helper : retourne isOpen pour les composants qui veulent juste
 * disable leurs CTAs sans afficher le banner.
 */
export function useIsRestaurantOpen(): {
  isOpen: boolean;
  loading: boolean;
  message: string;
} {
  const { status, loading } = useRestaurantStatus();
  return {
    isOpen: status?.isOpen ?? true, // default true pendant loading
    loading,
    message: status?.message ?? "",
  };
}
