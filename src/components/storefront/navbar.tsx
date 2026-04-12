"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Menu as MenuIcon,
  X,
  User,
  Gift,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/menu", label: "La carte" },
  { href: "/account/loyalty", label: "Fidélité" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={cn(
          "flex items-center gap-1 rounded-full px-2 transition-all duration-500",
          scrolled
            ? "bg-white/10 backdrop-blur-xl border border-white/[0.08] shadow-lg shadow-black/10"
            : "bg-white/[0.06] backdrop-blur-md border border-white/[0.05]"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center px-3 py-2">
          <Logo size="sm" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 text-sm font-light rounded-full transition-colors",
                pathname === link.href
                  ? "text-white"
                  : "text-white/60 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center">
          <Link href="/account">
            <button className="p-2.5 text-white/60 hover:text-white transition-colors" aria-label="Mon compte">
              <User className="h-4 w-4" />
            </button>
          </Link>

          <Link href="/cart" className="relative">
            <button className="p-2.5 text-white/60 hover:text-white transition-colors" aria-label="Panier">
              <ShoppingBag className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-brand text-[9px] font-medium text-white flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </Link>

          {/* CTA */}
          <Link
            href="/menu"
            className="hidden md:flex items-center gap-1.5 ml-1 px-5 py-2 text-sm font-medium text-white bg-white/[0.12] hover:bg-white/[0.18] rounded-full border border-white/[0.1] transition-all"
          >
            Commander
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2.5 text-white/60 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <MenuIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-full left-4 right-4 mt-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/[0.08] p-3 animate-fade-in md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-light transition-colors",
                pathname === link.href
                  ? "text-white bg-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {link.href === "/account/loyalty" && (
                <Gift className="h-4 w-4" />
              )}
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
