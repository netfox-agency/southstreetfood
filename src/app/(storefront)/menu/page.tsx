"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────── */

interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  category_slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  items: MenuItem[];
}

/* ─── Menu data (will fetch from Supabase) ─── */

const MENU: Category[] = [
  {
    id: "1", name: "COMPOSE, Ici C'est Toi Le Boss !", slug: "compose", emoji: "✍️",
    items: [
      { id: "i1", name: "Tacos L", slug: "tacos-l", description: "Un tacos 2 viandes genereux, compose de deux viandes au choix, accompagne de frites fondantes et d'une sauce fromagere onctueuse.", base_price: 1190, image_url: null, is_available: true, is_featured: true, category_slug: "compose" },
      { id: "i2", name: "Tacos XL", slug: "tacos-xl", description: "Un tacos 3 viandes ultra genereux, compose de trois viandes au choix, accompagne de frites fondantes et d'une sauce fromagere.", base_price: 1390, image_url: null, is_available: true, is_featured: true, category_slug: "compose" },
      { id: "i3", name: "Tacos M", slug: "tacos-m", description: "Un tacos 1 viande genereux, garni de la viande de votre choix, accompagne de frites fondantes et d'une sauce fromagere.", base_price: 990, image_url: null, is_available: true, is_featured: false, category_slug: "compose" },
      { id: "i4", name: "Bowl M", slug: "bowl-m", description: "Un Bowl 1 viande genereux, garni de la viande de votre choix, accompagne de frites fondantes et d'une sauce fromagere.", base_price: 990, image_url: null, is_available: true, is_featured: false, category_slug: "compose" },
      { id: "i5", name: "Bowl L", slug: "bowl-l", description: "Un Bowl 2 viandes genereux, compose de deux viandes au choix, accompagne de frites fondantes et d'une sauce fromagere.", base_price: 1190, image_url: null, is_available: true, is_featured: false, category_slug: "compose" },
      { id: "i6", name: "Bowl XL", slug: "bowl-xl", description: "Un Bowl 3 viandes ultra genereux, compose de trois viandes au choix, accompagne de frites fondantes et d'une sauce fromagere.", base_price: 1390, image_url: null, is_available: true, is_featured: false, category_slug: "compose" },
    ],
  },
  {
    id: "2", name: "Nos Tacos SIGNATURES", slug: "tacos-signatures", emoji: "✨",
    items: [
      { id: "i7", name: "Tacos Crispy Food", slug: "tacos-crispy", description: "Un tacos gourmand et croustillant avec tenders, frites fondantes, sauce fromagere et la touche sucree-salee.", base_price: 1150, image_url: null, is_available: true, is_featured: true, category_slug: "tacos-signatures" },
      { id: "i8", name: "Tacos Street Spicy", slug: "tacos-spicy", description: "Un tacos genereux avec tenders croustillants, frites dorees, nappe de sauce fromagere et releve d'une sauce spicy.", base_price: 1150, image_url: null, is_available: true, is_featured: false, category_slug: "tacos-signatures" },
    ],
  },
  {
    id: "3", name: "Nos Burgers PREMIUM", slug: "burgers-premium", emoji: "🤌",
    items: [
      { id: "i9", name: "Cheeseburger", slug: "cheeseburger", description: "Un cheeseburger simple et savoureux, compose d'un steak hache juteux et d'une tranche de cheddar fondante.", base_price: 550, image_url: null, is_available: true, is_featured: false, category_slug: "burgers-premium" },
      { id: "i10", name: "Montagnard burger", slug: "montagnard", description: "Un burger montagnard au choix : 2 steak hache 90g ou 2 filet de poulet crunchy, genereusement garni de raclette fondante.", base_price: 1200, image_url: null, is_available: true, is_featured: true, category_slug: "burgers-premium" },
      { id: "i11", name: "Le Big Mc", slug: "big-mc", description: "Un Big Mc iconique compose de deux steaks haches, de cheddar fondant, de salade croquante, d'oignons et de sauce speciale.", base_price: 850, image_url: null, is_available: true, is_featured: false, category_slug: "burgers-premium" },
      { id: "i12", name: "Big cheeseburger", slug: "big-cheese", description: "Un Big Cheese genereux au choix : 1 steak hache 90g ou 1 poulet crunchy, accompagne de cheddar fondant.", base_price: 950, image_url: null, is_available: true, is_featured: false, category_slug: "burgers-premium" },
      { id: "i13", name: "Le 180", slug: "le-180", description: "Un burger gourmand compose d'un steak de 180g, juteux et parfaitement grille, niche dans un pain moelleux.", base_price: 1200, image_url: null, is_available: true, is_featured: true, category_slug: "burgers-premium" },
    ],
  },
  {
    id: "4", name: "Nos WRAPS", slug: "wraps", emoji: "🌯",
    items: [
      { id: "i14", name: "Wrap poulet", slug: "wrap-poulet", description: "Un wrap poulet gourmand garni de morceaux de poulet croustillant, accompagnes de crudites fraiches et de cheddar fondu.", base_price: 950, image_url: null, is_available: true, is_featured: false, category_slug: "wraps" },
      { id: "i15", name: "Wrap steak", slug: "wrap-steak", description: "Un wrap genereux garni de deux steaks haches de 45g, juteux et savoureux, accompagnes de cheddar fondu et de crudites.", base_price: 950, image_url: null, is_available: true, is_featured: false, category_slug: "wraps" },
    ],
  },
  {
    id: "5", name: "Pour Les FIT", slug: "fit", emoji: "🥗",
    items: [
      { id: "i16", name: "Salade Cesar", slug: "salade-cesar", description: "Une salade Cesar gourmande et coloree, melant salade croquante, tomates cerises juteuses, mais sucre, oignons et crotons.", base_price: 700, image_url: null, is_available: true, is_featured: false, category_slug: "fit" },
    ],
  },
  {
    id: "6", name: "A PARTAGER (ou pas) !", slug: "partager", emoji: "🍗",
    items: [
      { id: "i17", name: "Tenders croustillants x5", slug: "tenders-x5", description: "Des tenders de poulet croustillants a l'exterieur et fondants a l'interieur, prepares avec un poulet savoureux.", base_price: 650, image_url: null, is_available: true, is_featured: false, category_slug: "partager" },
      { id: "i18", name: "Nuggets croustillants x6", slug: "nuggets-x6", description: "Des nuggets de poulet croustillants a l'exterieur et moelleux a l'interieur, prepares a partir de poulet savoureux.", base_price: 650, image_url: null, is_available: true, is_featured: false, category_slug: "partager" },
      { id: "i19", name: "Chili cheese x6", slug: "chili-cheese", description: "Des chili cheese croustillants a l'exterieur, renfermant un coeur fondant de fromage releve d'une touche pimentee.", base_price: 650, image_url: null, is_available: true, is_featured: false, category_slug: "partager" },
    ],
  },
  {
    id: "7", name: "Ta Senti La PATATE", slug: "patate", emoji: "🍟",
    items: [
      { id: "i20", name: "Frites sale", slug: "frites-sale", description: "Des frites dorees et croustillantes, legerement salees pour reveler toute leur saveur.", base_price: 250, image_url: null, is_available: true, is_featured: false, category_slug: "patate" },
      { id: "i21", name: "Frites Cheddar", slug: "frites-cheddar", description: "Des frites croustillantes et dorees, nappees d'un cheddar fondant et genereux.", base_price: 400, image_url: null, is_available: true, is_featured: false, category_slug: "patate" },
      { id: "i22", name: "Frites Cheddar Bacon", slug: "frites-cheddar-bacon", description: "Des frites dorees et croustillantes, genereusement recouvertes de cheddar fondant et de bacon croustillant.", base_price: 500, image_url: null, is_available: true, is_featured: false, category_slug: "patate" },
    ],
  },
  {
    id: "8", name: "RAFRAICHIT ou DIGERE", slug: "boissons", emoji: "🧃",
    items: [
      { id: "i23", name: "Coca-Cola", slug: "coca-cola", description: null, base_price: 249, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i24", name: "Coca-Cola cherry", slug: "coca-cherry", description: null, base_price: 249, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i25", name: "Ice tea", slug: "ice-tea", description: null, base_price: 249, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i26", name: "Oasis fraise framboise", slug: "oasis-fraise", description: null, base_price: 249, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i27", name: "Red Bull", slug: "red-bull", description: null, base_price: 299, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i28", name: "Hawai", slug: "hawai", description: null, base_price: 249, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i29", name: "Oasis tropical", slug: "oasis-tropical", description: null, base_price: 249, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i30", name: "Eau plate", slug: "eau-plate", description: null, base_price: 199, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i31", name: "Orangina", slug: "orangina", description: null, base_price: 249, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i32", name: "Fanta", slug: "fanta", description: null, base_price: 249, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
      { id: "i33", name: "Coca-Cola zero", slug: "coca-zero", description: null, base_price: 249, image_url: null, is_available: true, is_featured: false, category_slug: "boissons" },
    ],
  },
  {
    id: "9", name: "Nos Desserts GOURMANDS", slug: "desserts", emoji: "🧁",
    items: [
      { id: "i34", name: "Tiramisus", slug: "tiramisu", description: "Un tiramisu onctueux aux couches genereuses de creme legere et de biscuits subtile et releve.", base_price: 400, image_url: null, is_available: true, is_featured: false, category_slug: "desserts" },
      { id: "i35", name: "Tarte au daims", slug: "tarte-daims", description: "Une part de tarte au Daim irresistiblement gourmande, melant une base croustillante et une creme fondante au caramel.", base_price: 400, image_url: null, is_available: true, is_featured: false, category_slug: "desserts" },
      { id: "i36", name: "Cheesecake", slug: "cheesecake", description: "Un cheesecake onctueux et fondant, reposant sur une base biscuitee croustillante.", base_price: 499, image_url: null, is_available: true, is_featured: false, category_slug: "desserts" },
    ],
  },
  {
    id: "10", name: "South CHEESE", slug: "cheese", emoji: "🧀",
    items: [
      { id: "i37", name: "Cheddar Fondu", slug: "cheddar-fondu", description: null, base_price: 300, image_url: null, is_available: true, is_featured: false, category_slug: "cheese" },
    ],
  },
];

/* ─── Helpers ─────────────────────────────────── */

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " \u20ac";
}

/* ─── Component: Menu Item Row (Uber Eats style) */

function MenuItemRow({ item }: { item: MenuItem }) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
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
    <div className="flex items-stretch border border-border rounded-2xl overflow-hidden hover:border-foreground/15 transition-colors group cursor-pointer">
      {/* Text content */}
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
      </div>

      {/* Image + add button */}
      <div className="relative w-[140px] shrink-0 bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center text-3xl">
            {item.category_slug === "compose" ? "🌮" :
             item.category_slug === "tacos-signatures" ? "🌮" :
             item.category_slug === "burgers-premium" ? "🍔" :
             item.category_slug === "wraps" ? "🌯" :
             item.category_slug === "fit" ? "🥗" :
             item.category_slug === "partager" ? "🍗" :
             item.category_slug === "patate" ? "🍟" :
             item.category_slug === "boissons" ? "🥤" :
             item.category_slug === "desserts" ? "🍰" :
             item.category_slug === "cheese" ? "🧀" : "🍽️"}
          </div>
        )}
        {/* + button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer border border-border"
        >
          <Plus className="h-4 w-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────── */

export default function MenuPage() {
  const [search, setSearch] = useState("");
  const [activeSlug, setActiveSlug] = useState(MENU[0].slug);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const isScrollingFromClick = useRef(false);

  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());

  // Filter by search
  const filteredMenu = search.trim()
    ? MENU.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.description &&
              item.description.toLowerCase().includes(search.toLowerCase()))
        ),
      })).filter((cat) => cat.items.length > 0)
    : MENU;

  // Scroll spy: track which section is visible
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

  // Click tab -> scroll to section
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

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!tabsRef.current) return;
    const activeTab = tabsRef.current.querySelector(`[data-slug="${activeSlug}"]`);
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeSlug]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-5 pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              19:00 – 4:00
            </p>
          </div>
          {/* Search */}
          <div className="relative w-64">
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
      </div>

      {/* Category tabs - sticky */}
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
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu sections */}
      <div className="max-w-4xl mx-auto px-5 py-8">
        {filteredMenu.map((cat) => (
          <section
            key={cat.slug}
            id={cat.slug}
            ref={(el) => { sectionRefs.current[cat.slug] = el; }}
            className="mb-12"
          >
            <h2 className="text-xl font-bold text-foreground mb-5">
              {cat.emoji} {cat.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {cat.items.map((item) => (
                <MenuItemRow key={item.id} item={item} />
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

      {/* Floating cart bar */}
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
