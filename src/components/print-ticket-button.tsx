"use client";

import { useCallback, useRef, useState } from "react";
import { Printer, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One-click ticket printing via hidden iframe.
 *
 * Flow:
 *  1. User clicks the button
 *  2. Hidden iframe loads /ticket/{orderId}
 *  3. Once loaded, iframe.contentWindow.print() fires
 *  4. User sees the native print dialog (browser → select printer → print)
 *  5. Button shows ✓ feedback, then resets
 *
 * The kitchen page is never navigated away from.
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handlePrint = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (state === "loading") return;
      setState("loading");

      // Create or reuse hidden iframe
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

      // Flag pour eviter de fire print() 2x (signal + fallback timeout)
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

      // Le ticket nous envoie un postMessage quand il est rendu (fetch fini).
      // C'est plus fiable qu'un setTimeout magique : on print exactement quand
      // c'est pret, peu importe la latence reseau.
      const onMessage = (ev: MessageEvent) => {
        if (ev.origin !== window.location.origin) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = ev.data as any;
        if (
          data?.type === "ssf-ticket-ready" &&
          data?.orderId === orderId
        ) {
          window.removeEventListener("message", onMessage);
          // Petit delai pour laisser le browser apply les styles @media print
          setTimeout(doPrint, 100);
        }
      };
      window.addEventListener("message", onMessage);

      // Fallback : si le message n'arrive pas dans 5s (vieux navigateur,
      // cross-origin issue, etc.), on print quand meme — mieux qu'un user
      // qui attend pour rien.
      const fallback = setTimeout(() => {
        window.removeEventListener("message", onMessage);
        doPrint();
      }, 5000);

      iframe.onload = () => {
        // onload tire des que le HTML est parse, mais le client component a
        // pas encore fini son fetch. On laisse le postMessage piloter le
        // print. Le fallback timeout est notre filet de secours.
        void fallback; // referenced pour eviter "unused" lint
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
