"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEmergencyMode } from "@/hooks/use-emergency-mode";

/**
 * Bandeau visible sur toutes les pages /admin et /kitchen quand le mode
 * urgence est actif. Rappel constant pour eviter d'oublier de le rallumer
 * une fois que le probleme initial est resolu.
 */
export function EmergencyActiveBanner() {
  const { state, loading } = useEmergencyMode();
  if (loading || !state.active) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 text-sm font-semibold flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="truncate">
          MODE URGENCE ACTIF &middot; commandes en ligne coupees
        </span>
      </div>
      <Link
        href="/admin/settings"
        className="shrink-0 text-xs bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition-colors"
      >
        Gerer
      </Link>
    </div>
  );
}
