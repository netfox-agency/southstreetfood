"use client";

import { useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useEmergencyMode } from "@/hooks/use-emergency-mode";

/**
 * Bouton mode urgence pour la cuisine.
 *
 * - Si OFF : bouton rouge "Activer mode urgence" + modal de confirmation
 * - Si ON  : badge rouge "MODE URGENCE ACTIF" + message "Demander a un admin
 *           pour desactiver"
 *
 * La cuisine peut activer mais NE PEUT PAS desactiver (anti-fat-finger).
 * Quand la cuisine panique parce que l'imprimante a crashe, ils flippent le
 * switch. Apres, l'admin verifie que tout est OK et rallume.
 */
export function KitchenEmergencyButton() {
  const { state, loading } = useEmergencyMode();
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activate = async () => {
    setSubmitting(true);
    try {
      const r = await fetch("/api/admin/emergency-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }
      toast.success("Mode urgence active. Commandes en ligne coupees.");
      setShowConfirm(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (state.active) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide">
            Mode urgence actif
          </p>
          <p className="text-[11px] text-red-600 leading-tight">
            Commandes en ligne coupees. Admin uniquement pour rallumer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
        title="Couper les commandes en ligne en urgence"
      >
        <ShieldAlert className="h-4 w-4" />
        <span className="hidden sm:inline">Mode urgence</span>
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => !submitting && setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Activer le mode urgence ?
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Cela coupe immediatement les commandes en ligne. Les clients
              verront un banner rouge avec le numero du resto. A utiliser SI
              tu ne peux plus traiter les commandes (impr. cassee, rush
              ingerable, bug systeme).
            </p>
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 mb-4">
              Seul un admin peut rallumer apres. Ne flip pas par erreur.
            </p>
            <div className="flex gap-2">
              <button
                onClick={activate}
                disabled={submitting}
                className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "..." : "Oui, activer"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-foreground font-semibold text-sm cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
