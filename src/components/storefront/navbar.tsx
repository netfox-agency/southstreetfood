"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu as MenuIcon, X, Home, Gift, UtensilsCrossed } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { NavbarAuth } from "@/components/storefront/navbar-auth";
import { useEmergencyMode } from "@/hooks/use-emergency-mode";

/**
 * Navbar refonte — Apple polish + brand identity South Street.
 *
 * Architecture en 3 ilots flottants :
 *   1. Logo a gauche (transparent, pas dans la pill)
 *   2. Pill centrale glassy avec liens + active indicator anime (rose)
 *   3. Pill droite glassy avec auth + cart badge + CTA "Commander"
 *
 * Pourquoi flottant ? Le user voit instantanement que c'est un site
 * "premium" (Apple uses this pattern, Linear, Stripe, Cal). Plus de
 * full-width bar grise → plus d'air autour, vibe lounge.
 *
 * Mobile : pill bottom-fixed (zone pouce) avec 3 icones critiques :
 * Home / Menu / Fidelite. Cart badge pop-up sur la droite.
 */

const navLinks = [
  { href: "/menu", label: "La carte" },
  { href: "/fidelite", label: "Fidélité" },
];

const mobileBottomLinks = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/menu", label: "Carte", icon: UtensilsCrossed },
  { href: "/fidelite", label: "Fidélité", icon: Gift },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());
  // Mode urgence : le bandeau "commande par tel" (h-12 = 48px) occupe le haut.
  // On descend les pills flottantes juste en dessous pour ne pas les chevaucher.
  const { state: emergency } = useEmergencyMode();
  const emergencyActive = emergency.active;
  // Pulse the cart badge whenever count changes (item added)
  const [pulse, setPulse] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  // Bounce le badge a chaque ajout au panier
  useEffect(() => {
    if (!mounted) return;
    if (itemCount === 0) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(t);
  }, [itemCount, mounted]);

  /* ───────── Desktop floating pills ───────── */

  return (
    <>
      {/* ═══════ DESKTOP HEADER ═══════ */}
      <header
        className={cn(
          "fixed left-0 right-0 z-50 px-3 sm:px-6 transition-all duration-300 pointer-events-none",
          emergencyActive ? "top-[3.5rem] sm:top-[3.75rem]" : "top-3 sm:top-4",
        )}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 pointer-events-none">
          {/* Logo island — transparent backdrop sticker */}
          <div className="pointer-events-auto shrink-0">
            <Logo size="md" />
          </div>

          {/* Centered pill — desktop only */}
          <nav
            className={cn(
              "hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full pointer-events-auto",
              "bg-black/55 backdrop-blur-2xl border border-white/[0.08]",
              "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]",
              "transition-all duration-500",
              scrolled && "bg-black/70",
            )}
            aria-label="Navigation principale"
          >
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-200",
                    active ? "text-white" : "text-white/60 hover:text-white",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="navbar-pill-active"
                      className="absolute inset-0 rounded-full bg-[#e8416f]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right pill — auth + cart + CTA */}
          <div
            className={cn(
              "hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-full pointer-events-auto",
              "bg-black/55 backdrop-blur-2xl border border-white/[0.08]",
              "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]",
              "transition-all duration-500",
              scrolled && "bg-black/70",
            )}
          >
            <NavbarAuth />

            <Link
              href="/cart"
              className="relative h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Panier"
            >
              <ShoppingBag className="h-[17px] w-[17px]" />
              {mounted && itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{
                    scale: pulse ? [1, 1.4, 1] : 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: pulse ? 0.4 : 0.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-[#e8416f] text-[9px] font-bold text-white flex items-center justify-center tabular-nums"
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>

            <Link
              href="/menu"
              className={cn(
                "ml-1 inline-flex items-center px-4 h-9 rounded-full text-[13px] font-semibold",
                "bg-white text-[#0a0a0a] hover:bg-white/90",
                "transition-all duration-200 active:scale-[0.97]",
              )}
            >
              Commander
            </Link>
          </div>

          {/* Mobile right cluster — cart + burger as floating pill */}
          <div
            className={cn(
              "sm:hidden flex items-center gap-1 px-1.5 py-1.5 rounded-full pointer-events-auto",
              "bg-black/60 backdrop-blur-2xl border border-white/[0.08]",
              "shadow-[0_6px_20px_-6px_rgba(0,0,0,0.5)]",
            )}
          >
            <NavbarAuth />
            <Link
              href="/cart"
              className="relative h-9 w-9 rounded-full flex items-center justify-center text-white/80"
              aria-label="Panier"
            >
              <ShoppingBag className="h-[17px] w-[17px]" />
              {mounted && itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{
                    scale: pulse ? [1, 1.4, 1] : 1,
                    opacity: 1,
                  }}
                  transition={{ duration: pulse ? 0.4 : 0.2 }}
                  className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-[#e8416f] text-[9px] font-bold text-white flex items-center justify-center tabular-nums"
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="h-9 w-9 rounded-full flex items-center justify-center text-white/80"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════ MOBILE FULL-SCREEN MENU ═══════ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 sm:hidden bg-black/85 backdrop-blur-2xl"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pt-24 px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1.5">
                {navLinks.map((link, i) => {
                  const active = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center justify-between px-5 py-4 rounded-2xl text-base font-medium transition-colors",
                          active
                            ? "bg-[#e8416f] text-white"
                            : "bg-white/5 text-white hover:bg-white/10",
                        )}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="pt-4"
                >
                  <Link
                    href="/menu"
                    className="block w-full text-center px-5 py-4 rounded-2xl bg-white text-[#0a0a0a] font-bold"
                  >
                    Commander
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ MOBILE BOTTOM NAV ═══════
          Toujours visible sur mobile (zone pouce) avec les 3 routes
          critiques. Active = pill rose anime. Cache si menu ouvert. */}
      {!mobileOpen && (
        <nav
          className={cn(
            "fixed bottom-3 left-0 right-0 z-40 px-4 sm:hidden",
            "pointer-events-none",
          )}
          aria-label="Navigation mobile"
        >
          <div
            className={cn(
              "mx-auto max-w-sm flex items-center justify-around gap-1 px-2 py-2 rounded-full",
              "bg-black/70 backdrop-blur-2xl border border-white/[0.08]",
              "shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)]",
              "pointer-events-auto",
            )}
          >
            {mobileBottomLinks.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex-1 flex flex-col items-center justify-center gap-0.5 h-12 rounded-full transition-colors",
                    active ? "text-white" : "text-white/60",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-bottom-pill"
                      className="absolute inset-0 rounded-full bg-[#e8416f]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                      aria-hidden
                    />
                  )}
                  <Icon className="relative z-10 h-[18px] w-[18px]" />
                  <span className="relative z-10 text-[10px] font-semibold">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
