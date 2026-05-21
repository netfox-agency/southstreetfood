"use client";

import { AlertTriangle, Phone } from "lucide-react";
import { useEmergencyMode } from "@/hooks/use-emergency-mode";
import { BRAND } from "@/lib/constants";

const DEFAULT_MESSAGE = `Systeme de commande en ligne temporairement indisponible. Appelez-nous pour commander.`;

/**
 * Banner mode urgence — affiche en haut de toutes les pages storefront
 * quand l'admin (ou la cuisine) a active le kill-switch. La carte reste
 * visible derriere, mais commander en ligne est bloque. CTA telephone
 * tap-to-call gros et clair.
 *
 * Retourne null si mode urgence inactif (pas d'espace reserve).
 */
export function EmergencyBanner({ className = "" }: { className?: string }) {
  const { state, loading } = useEmergencyMode();
  if (loading || !state.active) return null;

  const message = state.message?.trim() || DEFAULT_MESSAGE;
  const telHref = `tel:${BRAND.phone.replace(/\s/g, "")}`;

  return (
    <div
      className={`w-full bg-gradient-to-r from-red-600 to-rose-600 text-white border-b border-red-700 px-4 py-3 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="mx-auto max-w-4xl flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{message}</p>
          <p className="text-[11px] opacity-90 mt-0.5">
            Commande par telephone uniquement
          </p>
        </div>
        <a
          href={telHref}
          className="shrink-0 inline-flex items-center gap-2 bg-white text-red-700 rounded-full px-4 py-2 text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">{BRAND.phone}</span>
          <span className="sm:hidden">Appeler</span>
        </a>
      </div>
    </div>
  );
}
