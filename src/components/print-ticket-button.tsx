"use client";

import { useCallback, useState } from "react";
import { Printer, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Bouton d'impression du ticket via le bridge local.
 *
 * Flow :
 *   1. Clic → POST /api/admin/printer/print-order { orderId }
 *   2. L'endpoint cree un print_job en 'pending' dans Supabase
 *   3. Le bridge (Mac/PC du resto) le voit via Realtime
 *   4. Le bridge envoie l'XML ePOS a l'imprimante Epson TM-m30
 *   5. Ticket sort dans 1-3 sec
 *
 * Visuellement le bouton montre :
 *   - idle    : icone imprimante
 *   - loading : spinner
 *   - done    : check vert (2 sec, retour idle)
 *   - error   : icone alerte (toast erreur)
 *
 * Si le bridge ne tourne pas, le job reste 'pending' indefiniment cote
 * Supabase mais le bouton aura quand meme affiche un check vert (la
 * creation du job a reussi). C'est OK : on peut pas savoir si l'imprimante
 * physique a recu sans attendre. Pour de la confirmation reelle, voir
 * /admin/printer.
 */
export function PrintTicketButton({
  orderId,
  size = "md",
  className,
}: {
  orderId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handlePrint = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (state === "loading") return;

      setState("loading");
      try {
        const res = await fetch("/api/admin/printer/print-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setState("done");
        if (data.reused) {
          toast.info("Ticket deja en attente d'impression");
        } else {
          toast.success("Ticket envoye a l'imprimante");
        }
        setTimeout(() => setState("idle"), 2000);
      } catch (err) {
        setState("error");
        toast.error(
          err instanceof Error
            ? `Impression echouee : ${err.message}`
            : "Impression echouee",
        );
        setTimeout(() => setState("idle"), 3000);
      }
    },
    [orderId, state],
  );

  const sizes = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 rounded-xl",
    lg: "h-14 w-14 rounded-xl",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      onClick={handlePrint}
      disabled={state === "loading"}
      title="Imprimer le ticket"
      className={cn(
        sizes[size],
        "flex items-center justify-center border-2 border-[#e5e5ea] transition-all cursor-pointer shrink-0",
        state === "done"
          ? "bg-emerald-50 border-emerald-200"
          : state === "error"
            ? "bg-red-50 border-red-200"
            : "hover:bg-[#f5f5f7]",
        state === "loading" && "opacity-60",
        className,
      )}
    >
      {state === "loading" ? (
        <Loader2 className={cn(iconSizes[size], "text-[#86868b] animate-spin")} />
      ) : state === "done" ? (
        <Check className={cn(iconSizes[size], "text-emerald-600")} />
      ) : state === "error" ? (
        <AlertCircle className={cn(iconSizes[size], "text-red-600")} />
      ) : (
        <Printer className={cn(iconSizes[size], "text-[#1d1d1f]")} />
      )}
    </button>
  );
}
