"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 group", className)}
    >
      {/* Purple circle icon */}
      <div
        className={cn(
          "rounded-xl bg-brand-purple flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105",
          size === "sm" && "h-8 w-8 text-xs",
          size === "md" && "h-9 w-9 text-sm",
          size === "lg" && "h-12 w-12 text-base"
        )}
      >
        SS
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            "font-extrabold tracking-tight leading-none text-foreground",
            sizeStyles[size]
          )}
        >
          SOUTH STREET
        </span>
        <span
          className={cn(
            "text-brand-purple font-bold tracking-widest leading-none",
            size === "sm" && "text-[10px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}
        >
          FOOD
        </span>
      </div>
    </Link>
  );
}
