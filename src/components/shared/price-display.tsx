import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  cents: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({
  cents,
  className,
  size = "md",
}: PriceDisplayProps) {
  return (
    <span
      className={cn(
        "font-semibold tabular-nums text-foreground",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-xl",
        className
      )}
    >
      {formatPrice(cents)}
    </span>
  );
}
