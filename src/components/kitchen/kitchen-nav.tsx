"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, History, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/kitchen", label: "Live", icon: ChefHat },
  { href: "/kitchen/history", label: "Historique", icon: History },
  { href: "/kitchen/menu", label: "Menu", icon: UtensilsCrossed },
];

/**
 * Small subnav shared by every kitchen page. Kept tablet-first: dense,
 * high-contrast, big tap targets.
 */
export function KitchenNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 bg-[#f5f5f7] rounded-full p-1">
      {LINKS.map((link) => {
        // Exact match for "/kitchen" so it doesn't light up on sub-pages.
        const active =
          link.href === "/kitchen"
            ? pathname === "/kitchen"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-[13px] font-semibold transition-all",
              active
                ? "bg-white text-[#1d1d1f] shadow-sm"
                : "text-[#86868b] hover:text-[#1d1d1f]"
            )}
          >
            <link.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
