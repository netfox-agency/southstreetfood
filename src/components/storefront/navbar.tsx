"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Menu as MenuIcon,
  X,
  Gift,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { NavbarAuth } from "@/components/storefront/navbar-auth";

const navLinks = [
  { href: "/menu", label: "La carte" },
  { href: "/fidelite", label: "Fidélité" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Zustand + persist hydrate apres le SSR (le serveur n'a pas acces au
  // localStorage). Sans ce guard, le cart badge cause un hydration mismatch :
  // SSR rend 0 items → client rend N items → React panique.
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-black/40 backdrop-blur-xl border-b border-white/[0.06]"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Nav — centered */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm transition-colors",
                  pathname === link.href
                    ? "text-white font-medium"
                    : "text-white/60 hover:text-white font-light"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right — auth + cart + CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NavbarAuth />

            <Link href="/cart" className="relative p-2 text-white/60 hover:text-white transition-colors">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-white text-[9px] font-semibold text-black flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              href="/menu"
              className="hidden md:inline-flex items-center px-5 py-1.5 text-sm font-medium text-white rounded-full border border-white/[0.25] hover:bg-white/[0.1] transition-all duration-300"
            >
              Commander
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/80 backdrop-blur-xl border-t border-white/[0.06] animate-fade-in">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors",
                  pathname === link.href
                    ? "text-white bg-white/10 font-medium"
                    : "text-white/60 hover:text-white font-light"
                )}
              >
                {link.href === "/account/loyalty" && (
                  <Gift className="h-4 w-4" />
                )}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
