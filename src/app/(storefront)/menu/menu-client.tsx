"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const CATEGORY_EMOJIS: Record<string, string> = {
  compose: "✍️",
  "tacos-signatures": "✨",
  "burgers-premium": "🤌",
  wraps: "🌯",
  fit: "🥗",
  partager: "🍗",
  patate: "🍟",
  boissons: "🧃",
  desserts: "🧁",
  cheese: "🧀",
};

const ITEM_EMOJIS: Record<string, string> = {
  compose: "🌮",
  "tacos-signatures": "🌮",
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

function MenuItemRow({
  item,
  categorySlug,
}: {
  item: MenuItemData;
  categorySlug: string;
}) {
  const addItem = useCartStore((s) => s.addItem);

  // Uber Eats-style logic:
  //  - Item WITH options (variants/extras)  → "+" opens the composer page
  //  - Item WITHOUT options (drinks, fries) → "+" quick-adds to the cart
  // Clicking anywhere else on the card ALWAYS opens the item detail page.
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    toast.success(`${item.name} ajoute au panier`);
  };

  return (
    <Link href={`/item/${item.slug}`}>
      <div
        className={cn(
          "flex items-stretch border border-border rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer",
          "hover:border-foreground/15 hover:shadow-sm",
          !item.is_available && "opacity-50 pointer-events-none"
        )}
      >
        <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
          <h3 className="font-semibold text-[15px] text-foreground truncate">
            {item.name}
          </h3>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {formatPrice(item.base_price)}
          </p>
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

        <div className="relative w-[140px] shrink-0 bg-muted">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center text-3xl">
              {ITEM_EMOJIS[categorySlug] || "🍽️"}
            </div>
          )}
          {item.is_available &&
            (item.has_options ? (
              // Item with options: "+" is purely visual, card click
              // already brings user to the detail page where they
              // compose the order.
              <div
                aria-hidden="true"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center border border-border group-hover:scale-110 transition-transform"
              >
                <Plus className="h-4 w-4 text-foreground" />
              </div>
            ) : (
              // Simple item (boisson, frites…): "+" quick-adds directly.
              <button
                type="button"
                onClick={handleQuickAdd}
                aria-label={`Ajouter ${item.name} au panier`}
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer border border-border"
              >
                <Plus className="h-4 w-4 text-foreground" />
              </button>
            ))}
        </div>
      </div>
    </Link>
  );
}

export function MenuClient({ categories }: { categories: CategoryData[] }) {
  const [search, setSearch] = useState("");
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug || "");
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
    const activeTab = tabsRef.current.querySelector(
      `[data-slug="${activeSlug}"]`
    );
    if (activeTab) {
      activeTab.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeSlug]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-5 pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              19:00 – 4:00
            </p>
          </div>
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-full bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden max-w-4xl mx-auto px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher dans South Street Food"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="sticky top-16 z-30 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-5">
          <div
            ref={tabsRef}
            className="flex gap-0 overflow-x-auto scrollbar-none -mx-1"
          >
            {filteredMenu.map((cat) => (
              <button
                key={cat.slug}
                data-slug={cat.slug}
                onClick={() => scrollToSection(cat.slug)}
                className={cn(
                  "shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors cursor-pointer",
                  activeSlug === cat.slug
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {CATEGORY_EMOJIS[cat.slug] || ""} {cat.name}
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
            <h2 className="text-xl font-bold text-foreground mb-5">
              {CATEGORY_EMOJIS[cat.slug] || ""} {cat.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {cat.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  categorySlug={cat.slug}
                />
              ))}
            </div>
          </section>
        ))}

        {filteredMenu.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">Aucun resultat</p>
            <p className="text-sm">Essayez un autre terme de recherche</p>
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Link href="/cart">
            <button className="flex items-center gap-3 bg-foreground text-background px-6 py-3.5 rounded-2xl shadow-lg shadow-black/20 hover:opacity-90 transition-opacity cursor-pointer">
              <ShoppingBag className="h-5 w-5" />
              <span className="font-semibold text-sm">
                Voir le panier ({itemCount})
              </span>
              <span className="text-sm font-semibold ml-1">
                {formatPrice(subtotal)}
              </span>
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
