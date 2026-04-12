"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Wrap in a Link to /. Default true. */
  asLink?: boolean;
}

/** Native logo resolution (from the client asset). */
const NATIVE_W = 768;
const NATIVE_H = 463;

const heights = {
  sm: 36,
  md: 48,
  lg: 56,
};

export function Logo({ className, size = "md", asLink = true }: LogoProps) {
  const h = heights[size];
  const w = Math.round((NATIVE_W / NATIVE_H) * h);

  const img = (
    <Image
      src="/brand/logo.avif"
      alt="South Street Food"
      width={w}
      height={h}
      priority={size === "lg"}
      className="object-contain transition-transform group-hover:scale-[1.03]"
    />
  );

  if (!asLink) {
    return <div className={cn("inline-flex items-center group", className)}>{img}</div>;
  }

  return (
    <Link
      href="/"
      aria-label="South Street Food"
      className={cn("inline-flex items-center group", className)}
    >
      {img}
    </Link>
  );
}
