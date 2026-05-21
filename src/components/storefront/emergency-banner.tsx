"use client";

import { Phone } from "lucide-react";
import { useEmergencyMode } from "@/hooks/use-emergency-mode";
import { BRAND } from "@/lib/constants";

const DEFAULT_MESSAGE = `Aujourd'hui, commande par telephone uniquement.`;

/**
 * Banner mode urgence — version "calme" cote client.
 *
 * On ne veut PAS communiquer "URGENCE PROBLEME PANIQUE" au client. Juste
 * une indication neutre : aujourd'hui les commandes online sont pas dispo,
 * passez par tel. La carte reste consultable normalement.
 *
 * Visuel = dark brand (noir/blanc), gros bouton tel, ton positif.
 * Le "mode urgence" est un terme INTERNE : cote client c'est "commandes
 * au telephone uniquement".
 */
export function EmergencyBanner({ className = "" }: { className?: string }) {
  const { state, loading } = useEmergencyMode();
  if (loading || !state.active) return null;

  const message = state.message?.trim() || DEFAULT_MESSAGE;
  const telHref = `tel:${BRAND.phone.replace(/\s/g, "")}`;

  return (
    <div
      className={`w-full bg-[#1d1d1f] text-white border-b border-black/10 px-4 py-2.5 ${className}`}
      role="status"
    >
      <div className="mx-auto max-w-4xl flex items-center gap-3">
        <Phone className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <p className="flex-1 min-w-0 text-[13px] sm:text-sm font-medium leading-tight truncate">
          {message}
        </p>
        <a
          href={telHref}
          className="shrink-0 inline-flex items-center gap-1.5 bg-white text-[#1d1d1f] rounded-full px-3.5 py-1.5 text-[13px] font-semibold shadow-sm hover:shadow-md active:scale-95 transition-all"
        >
          <Phone className="h-3.5 w-3.5" />
          {BRAND.phone}
        </a>
      </div>
    </div>
  );
}
