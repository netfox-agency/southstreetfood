"use client";

import { useCallback, useRef, useState } from "react";
import { Printer, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bouton d'impression du ticket.
 *
 * 2 strategies selon le device :
 *
 * 1. **Desktop / Mac / Windows (Chrome, Edge, Firefox, Safari Mac)** :
 *    Iframe cachée qui charge /ticket/[id] → contentWindow.print().
 *    Le staff reste sur la page kitchen, le dialog d'impression apparaît,
 *    il imprime, dialog se ferme, retour direct au board. C'est le flow
 *    le plus fluide en cuisine quand on a un PC ou Mac.
 *
 * 2. **iPad / iPhone (iOS Safari + Chrome iOS)** :
 *    L'iframe + contentWindow.print() est buggé sur iOS Safari (le
 *    moteur Webkit interdit print() dans certains contextes iframe).
 *    Solution propre : on ouvre /ticket/[id] dans la même fenêtre.
 *    La page ticket a son propre bouton "Imprimer" qui appelle
 *    window.print() sur l'onglet principal → dialog AirPrint natif iOS
 *    → l'imprimante Epson TM-m30 apparait → impression.
 *
 *    Sur iPad cuisine, le staff fait :
 *      a) Clic icône imprimante sur la card commande
 *      b) Le ticket s'affiche en plein écran
 *      c) Clic gros bouton "Imprimer" en haut
 *      d) Dialog iOS → "Imprimer" → ticket sort
 *      e) Clic "Retour" pour revenir au board cuisine
 *
 *    1 clic de plus que le desktop, mais c'est le seul flow fiable
 *    sur iPad (Webkit ne laisse pas le choix).
 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPad iOS 13+ se déclare en "MacIntel" avec touch — détection moderne
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function PrintTicketButton({
  orderId,
  size = "md",
  className,
}: {
  orderId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handlePrint = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (state === "loading") return;

      // 📱 iPad / iPhone : iframe + print() est buggué sur iOS Webkit.
      // On ouvre la page ticket directement, le staff tap "Imprimer" sur la
      // page → dialog AirPrint iOS natif → imprimante détectée. Marche à
      // 100% avec l'Epson TM-m30 qui est déjà appairée en AirPrint.
      if (isIOS()) {
        // Use window.location pour rester dans le même onglet (iOS Safari
        // bloque souvent window.open en popup, surtout en kiosk mode).
        window.location.href = `/ticket/${orderId}`;
        return;
      }

      // 💻 Desktop : iframe cachée + print() direct, staff reste sur kitchen.
      setState("loading");

      let iframe = iframeRef.current;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.top = "-9999px";
        iframe.style.left = "-9999px";
        iframe.style.width = "302px";
        iframe.style.height = "0";
        iframe.style.border = "none";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
      }

      let printed = false;
      const doPrint = () => {
        if (printed) return;
        printed = true;
        try {
          iframe!.contentWindow?.print();
        } catch {
          window.open(`/ticket/${orderId}`, "_blank");
        }
        setState("done");
        setTimeout(() => setState("idle"), 2000);
      };

      const onMessage = (ev: MessageEvent) => {
        if (ev.origin !== window.location.origin) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = ev.data as any;
        if (data?.type === "ssf-ticket-ready" && data?.orderId === orderId) {
          window.removeEventListener("message", onMessage);
          setTimeout(doPrint, 100);
        }
      };
      window.addEventListener("message", onMessage);

      const fallback = setTimeout(() => {
        window.removeEventListener("message", onMessage);
        doPrint();
      }, 5000);

      iframe.onload = () => {
        void fallback;
      };

      iframe.src = `/ticket/${orderId}`;
    },
    [orderId, state]
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
          : "hover:bg-[#f5f5f7]",
        state === "loading" && "opacity-60",
        className
      )}
    >
      {state === "loading" ? (
        <Loader2 className={cn(iconSizes[size], "text-[#86868b] animate-spin")} />
      ) : state === "done" ? (
        <Check className={cn(iconSizes[size], "text-emerald-600")} />
      ) : (
        <Printer className={cn(iconSizes[size], "text-[#1d1d1f]")} />
      )}
    </button>
  );
}
