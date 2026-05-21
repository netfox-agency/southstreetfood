"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ItemSheet } from "@/components/storefront/item-sheet";
import { MENU_ELIGIBLE_SLUGS } from "@/lib/constants";
import { useStockRealtime } from "@/hooks/use-stock-realtime";
import { ClosedBanner } from "@/components/storefront/closed-banner";
import { useEmergencyMode } from "@/hooks/use-emergency-mode";

interface MenuItemData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  category_id: string;
  /** True when the item has variants or extras that require a choice screen. */
  has_options: boolean;
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  items: MenuItemData[];
}

// Emojis de fallback — utilises UNIQUEMENT quand un item n'a pas d'image
// (pour eviter un vide visuel). Les titres de categorie n'utilisent plus
// d'emoji, look Apple propre.
const ITEM_FALLBACK_EMOJIS: Record<string, string> = {
  compose: "🌮",
  "burgers-premium": "🍔",
  wraps: "🌯",
  fit: "🥗",
  partager: "🍗",
  patate: "🍟",
  boissons: "🥤",
  desserts: "🍰",
  cheese: "🧀",
};

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " \u20ac";
}

interface SheetPreview {
  slug: string;
  name: string;
  base_price: number;
  image_url: string | null;
  description: string | null;
}

function MenuItemRow({
  item,
  categorySlug,
  onOpenSheet,
  emergencyActive,
}: {
  item: MenuItemData;
  categorySlug: string;
  onOpenSheet: (preview: SheetPreview) => void;
  emergencyActive: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (emergencyActive) {
      toast("Commande au telephone aujourd'hui", {
        description: "Appelez-nous pour passer commande",
      });
      return;
    }
    addItem({
      menuItemId: item.id,
      menuItemName: item.name,
      menuItemImage: item.image_url,
      variantId: null,
      variantName: null,
      extras: [],
      quantity: 1,
      unitPrice: item.base_price,
      extrasPrice: 0,
      specialInstructions: null,
    });
    toast.success(`${item.name} ajouté au panier`);
  };

  const openSheet = () => {
    onOpenSheet({
      slug: item.slug,
      name: item.name,
      base_price: item.base_price,
      image_url: item.image_url,
      description: item.description,
    });
  };

  return (
    <div
      onClick={openSheet}
      className={cn(
        // Card flotte legerement, halo brand subtil au hover, image qui scale.
        // Garde la vibe "Vice City" sur la card mais avec polish Apple.
        "relative flex items-stretch border border-border rounded-2xl overflow-hidden group cursor-pointer",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:border-[#e8416f]/30 hover:shadow-[0_12px_28px_-12px_rgba(232,65,111,0.25)] hover:-translate-y-0.5",
        !item.is_available && "opacity-50 pointer-events-none",
      )}
    >
      <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
        <h3 className="font-semibold text-[15px] text-foreground truncate">
          {item.name}
        </h3>
        <p className="text-sm font-medium text-foreground mt-0.5">
          {formatPrice(item.base_price)}
        </p>
        {/* "En Menu +3€" hint — only on items eligible for the formule menu
            (burgers, wraps, tacos/bowl). Tells the customer the upgrade
            exists before they even open the sheet. */}
        {MENU_ELIGIBLE_SLUGS.includes(item.slug) && (
          <p className="text-[12px] font-semibold text-brand mt-1">
            + Menu (frites + boisson) +3€
          </p>
        )}
        {item.description && (
          <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        {!item.is_available && (
          <p className="text-xs text-red-500 font-medium mt-1">
            Indisponible
          </p>
        )}
      </div>

      <div className="relative w-[140px] shrink-0 bg-muted overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="140px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center text-3xl">
            {ITEM_FALLBACK_EMOJIS[categorySlug] || "🍽️"}
          </div>
        )}
        {item.is_available &&
          (item.has_options ? (
            <div
              aria-hidden="true"
              className={cn(
                "absolute bottom-2 right-2 h-9 w-9 rounded-full flex items-center justify-center",
                "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-border/40",
                "transition-[transform,box-shadow] duration-300",
                "group-hover:scale-110 group-hover:bg-[#e8416f] group-hover:border-transparent group-hover:shadow-[0_6px_16px_rgba(232,65,111,0.4)]",
              )}
            >
              <Plus className="h-4 w-4 text-foreground transition-colors duration-300 group-hover:text-white" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={`Ajouter ${item.name} au panier`}
              className={cn(
                "absolute bottom-2 right-2 h-9 w-9 rounded-full flex items-center justify-center cursor-pointer",
                "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-border/40",
                "transition-[transform,background-color,box-shadow] duration-300",
                "hover:scale-110 hover:bg-[#e8416f] hover:border-transparent hover:shadow-[0_6px_16px_rgba(232,65,111,0.4)]",
                "active:scale-95",
                "[&:hover>svg]:text-white",
              )}
            >
              <Plus className="h-4 w-4 text-foreground transition-colors duration-200" />
            </button>
          ))}
      </div>
    </div>
  );
}

export function MenuClient({ categories }: { categories: CategoryData[] }) {
  // Realtime cascade : si un ingredient ou item passe OOS cote cuisine,
  // la page se refresh automatiquement (debounce 400ms) pour refleter
  // l'etat reel sans refresh manuel du client.
  useStockRealtime();
  // Mode urgence hoisté ici : un seul channel Realtime + polling pour toute
  // la page menu, partagé entre tous les MenuItemRow via prop.
  const { state: emergency } = useEmergencyMode();

  const [search, setSearch] = useState("");
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug || "");
  const [sheetData, setSheetData] = useState<SheetPreview | null>(null);
  // Guard hydration : Zustand persist est async donc le itemCount SSR = 0
  // mais le client peut avoir N items. Sans le guard le badge "Voir le
  // panier (3)" flash apres hydration → hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const isScrollingFromClick = useRef(false);

  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());

  const filteredMenu = search.trim()
    ? categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.name.toLowerCase().includes(search.toLowerCase()) ||
              (item.description &&
                item.description.toLowerCase().includes(search.toLowerCase()))
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : categories;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingFromClick.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredMenu]);

  const scrollToSection = useCallback((slug: string) => {
    setActiveSlug(slug);
    isScrollingFromClick.current = true;
    const el = sectionRefs.current[slug];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setTimeout(() => {
      isScrollingFromClick.current = false;
    }, 800);
  }, []);

  useEffect(() => {
    if (!tabsRef.current) return;
    const container = tabsRef.current;
    const activeTab = container.querySelector<HTMLElement>(
      `[data-slug="${activeSlug}"]`
    );
    if (!activeTab) return;

    // Scroll HORIZONTAL uniquement du container, pas la page entiere.
    // L'ancienne version utilisait activeTab.scrollIntoView() qui peut
    // declencher un scroll vertical de la page meme avec block:nearest
    // dans certains browsers/scenarios → ressentait comme "la page
    // remonte toute seule" quand on scroll dans le menu. Bug critique
    // UX. Fix : on calcule le scrollLeft cible manuellement, on touche
    // jamais au scroll vertical.
    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const offsetLeft = tabRect.left - containerRect.left + container.scrollLeft;
    const targetScrollLeft =
      offsetLeft - container.clientWidth / 2 + tabRect.width / 2;

    container.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth",
    });
  }, [activeSlug]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Banner fermé — visible uniquement si resto fermé (horaires, override,
          ou fermeture temporaire). Realtime : change instantanément si l'admin
          toggle le statut côté cuisine. */}
      <ClosedBanner />
      <div className="relative max-w-4xl mx-auto px-5 pt-8 pb-4">
        {/* Halo brand subtle en haut a droite — anime la page */}
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-[#e8416f]/10 blur-[100px] pointer-events-none" />

        <Link
          href="/"
          className="relative inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl sm:text-6xl text-foreground tracking-tight leading-[0.95]">
              La carte.
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              19:00 – 4:00 · Bayonne
            </p>
          </div>
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)] text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#e8416f]/30 focus:border-[#e8416f]/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden max-w-4xl mx-auto px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher dans la carte"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-full bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)] text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#e8416f]/30 focus:border-[#e8416f]/30 transition-all"
          />
        </div>
      </div>

      {/* Sticky tabs — glassy avec active pill rose anime */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-2xl border-b border-border/60">
        <div className="max-w-4xl mx-auto px-5">
          <div
            ref={tabsRef}
            className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 py-2"
          >
            {filteredMenu.map((cat) => (
              <button
                key={cat.slug}
                data-slug={cat.slug}
                onClick={() => scrollToSection(cat.slug)}
                className={cn(
                  "relative shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-all duration-300 cursor-pointer",
                  activeSlug === cat.slug
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                )}
              >
                {activeSlug === cat.slug && (
                  <motion.span
                    layoutId="menu-tab-active"
                    className="absolute inset-0 rounded-full bg-[#e8416f]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    aria-hidden
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8">
        {filteredMenu.map((cat) => (
          <section
            key={cat.slug}
            id={cat.slug}
            ref={(el) => {
              sectionRefs.current[cat.slug] = el;
            }}
            className="mb-12"
          >
            <h2 className="font-display text-3xl sm:text-4xl text-foreground tracking-tight mb-5">
              {cat.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {cat.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  categorySlug={cat.slug}
                  onOpenSheet={setSheetData}
                  emergencyActive={emergency.active}
                />
              ))}
            </div>
          </section>
        ))}

        {filteredMenu.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌮</div>
            <p className="text-lg font-semibold text-foreground mb-2">Aucun résultat</p>
            <p className="text-sm text-muted-foreground mb-5">Essayez un autre terme de recherche</p>
            <button
              onClick={() => setSearch("")}
              className="inline-flex items-center px-5 h-10 rounded-full bg-[#e8416f] text-white text-sm font-semibold hover:bg-[#d63862] transition-colors active:scale-[0.97]"
            >
              Effacer la recherche
            </button>
          </div>
        )}
      </div>

      {/* FAB cart — bottom on desktop, au dessus de la bottom-nav sur mobile (b-24) */}
      {mounted && itemCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <Link href="/cart">
            <button className="flex items-center gap-3 bg-[#0a0a0a] text-white pl-5 pr-6 py-3.5 rounded-full shadow-[0_16px_40px_-8px_rgba(232,65,111,0.5)] hover:shadow-[0_20px_48px_-8px_rgba(232,65,111,0.6)] transition-all duration-300 active:scale-[0.97] cursor-pointer border border-white/10">
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#e8416f]">
                <ShoppingBag className="h-3.5 w-3.5" />
              </span>
              <span className="font-semibold text-sm">
                Voir le panier ({itemCount})
              </span>
              <span className="text-sm font-bold tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </button>
          </Link>
        </motion.div>
      )}

      {sheetData && (
        <ItemSheet
          slug={sheetData.slug}
          previewData={{
            name: sheetData.name,
            base_price: sheetData.base_price,
            image_url: sheetData.image_url,
            description: sheetData.description,
          }}
          onClose={() => setSheetData(null)}
        />
      )}
    </div>
  );
}
