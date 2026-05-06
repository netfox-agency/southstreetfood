import { cn } from "@/lib/utils";

/**
 * Skeleton loader brand-aware. Remplace les spinners pour les states
 * "mount" (Zustand persist hydration, etc.).
 *
 * Le shimmer est subtil mais bouge → percu plus rapide qu'un spinner.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-[#f0f0f2] via-[#e8e8ea] to-[#f0f0f2]",
        className,
      )}
      {...props}
    />
  );
}

/* ───────── Patterns pre-builts ───────── */

/** Skeleton complet pour la page /cart pendant l'hydration */
export function CartSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-lg px-5 py-8 space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2.5">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-2xl mt-4" />
        <Skeleton className="h-13 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Skeleton pour /checkout pendant l'hydration */
export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-lg px-5 py-8 space-y-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-13 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Pulse dot brand pour les loaders compacts (alternative au spinner) */
export function PulseDot({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8416f] opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e8416f]" />
      </span>
    </div>
  );
}
