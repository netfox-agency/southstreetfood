"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRestaurantStatus } from "@/hooks/use-restaurant-status";
import { formatParisTime } from "@/lib/queries/restaurant-status";

/**
 * Widget pour le dashboard cuisine : affiche le statut courant et
 * permet de le changer en 1 clic.
 *
 * 4 actions :
 *   - Ouvert        : force le resto ouvert (ignore les horaires)
 *   - Auto          : revient en mode automatique (horaires respectes)
 *   - Fermer 15 min : ferme temp pour 15 min
 *   - Fermer 30 min : ferme temp pour 30 min
 *   - Fermer 1h     : ferme temp pour 60 min
 *   - Fermer        : ferme indefiniment (reset manuel requis)
 */
export function StatusWidget() {
  const router = useRouter();
  const { status, loading } = useRestaurantStatus();
  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function setStatus(
    action: "open" | "closed" | "auto" | "temp_close",
    duration_minutes?: number,
    label?: string,
  ) {
    setPending(label || action);
    try {
      const res = await fetch("/api/kitchen/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(duration_minutes ? { duration_minutes } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        throw new Error(err.error || "Erreur");
      }
      toast.success(`Statut mis à jour : ${label || action}`);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(null);
    }
  }

  if (loading || !status) {
    return (
      <div className="h-20 rounded-2xl bg-[#f5f5f7] animate-pulse" />
    );
  }

  const { isOpen, reason, reopensAt, message } = status;
  const isAuto = reason === "scheduled_open" || reason === "scheduled_closed";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        isOpen
          ? "bg-emerald-50 border-emerald-200"
          : "bg-red-50 border-red-200",
      )}
    >
      {/* Status ligne */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          {isOpen ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p
              className={cn(
                "font-bold text-sm",
                isOpen ? "text-emerald-900" : "text-red-900",
              )}
            >
              {isOpen ? "Ouvert aux commandes" : "Fermé aux commandes"}
            </p>
            <p className="text-xs mt-0.5 text-[#1d1d1f]/70">
              {message}
              {isAuto && " (auto)"}
            </p>
            {reopensAt && !isAuto && (
              <p className="text-[11px] mt-0.5 text-[#86868b]">
                Retour auto à {formatParisTime(reopensAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        <ActionBtn
          onClick={() => setStatus("auto", undefined, "Auto")}
          disabled={pending !== null}
          active={reason === "scheduled_open" || reason === "scheduled_closed"}
          busy={pending === "Auto"}
          icon={Zap}
          label="Auto"
        />
        <ActionBtn
          onClick={() => setStatus("open", undefined, "Ouvert")}
          disabled={pending !== null}
          active={reason === "manual_open"}
          busy={pending === "Ouvert"}
          icon={CheckCircle2}
          label="Ouvrir"
          variant="green"
        />
        <ActionBtn
          onClick={() => setStatus("closed", undefined, "Fermé")}
          disabled={pending !== null}
          active={reason === "manual_closed"}
          busy={pending === "Fermé"}
          icon={XCircle}
          label="Fermer"
          variant="red"
        />
        <ActionBtn
          onClick={() => setStatus("temp_close", 15, "15 min")}
          disabled={pending !== null}
          busy={pending === "15 min"}
          icon={Clock}
          label="Pause 15 min"
          variant="amber"
        />
        <ActionBtn
          onClick={() => setStatus("temp_close", 30, "30 min")}
          disabled={pending !== null}
          busy={pending === "30 min"}
          icon={Clock}
          label="Pause 30 min"
          variant="amber"
        />
        <ActionBtn
          onClick={() => setStatus("temp_close", 60, "1 h")}
          disabled={pending !== null}
          busy={pending === "1 h"}
          icon={Clock}
          label="Pause 1 h"
          variant="amber"
        />
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  disabled,
  active,
  busy,
  icon: Icon,
  label,
  variant = "neutral",
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  busy?: boolean;
  icon: typeof CheckCircle2;
  label: string;
  variant?: "neutral" | "green" | "red" | "amber";
}) {
  const variantCls = {
    neutral: active
      ? "bg-[#1d1d1f] text-white"
      : "bg-white border border-[#e5e5ea] text-[#1d1d1f] hover:bg-[#f5f5f7]",
    green: active
      ? "bg-emerald-600 text-white"
      : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    red: active
      ? "bg-red-600 text-white"
      : "bg-white border border-red-200 text-red-700 hover:bg-red-50",
    amber:
      "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-1.5 h-10 px-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
        variantCls,
        busy && "animate-pulse",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}
