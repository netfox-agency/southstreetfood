"use client";

import { useState } from "react";
import { CategoryTabs } from "@/components/storefront/category-tabs";
import { MenuItemCard } from "@/components/storefront/menu-item-card";
import type { Category, MenuItem } from "@/types/menu";

// Demo data - will be replaced by Supabase server fetch
const DEMO_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Burgers", slug: "burgers", description: null, display_order: 1, image_url: null, is_active: true, created_at: "" },
  { id: "cat-2", name: "Tacos", slug: "tacos", description: null, display_order: 2, image_url: null, is_active: true, created_at: "" },
  { id: "cat-3", name: "Wraps", slug: "wraps", description: null, display_order: 3, image_url: null, is_active: true, created_at: "" },
  { id: "cat-4", name: "Accompagnements", slug: "accompagnements", description: null, display_order: 4, image_url: null, is_active: true, created_at: "" },
  { id: "cat-5", name: "Boissons", slug: "boissons", description: null, display_order: 5, image_url: null, is_active: true, created_at: "" },
];

const DEMO_ITEMS: MenuItem[] = [
  { id: "1", category_id: "cat-1", name: "Le Classic Smash", slug: "le-classic-smash", description: "Double smash patty, cheddar fondu, sauce maison, oignons caramelises", base_price: 990, image_url: null, is_available: true, is_featured: true, display_order: 1, allergens: ["Gluten", "Lait"], created_at: "", updated_at: "" },
  { id: "2", category_id: "cat-1", name: "Le South Burger", slug: "le-south-burger", description: "Triple viande, bacon croustillant, jalapenos, sauce BBQ fumee", base_price: 1290, image_url: null, is_available: true, is_featured: true, display_order: 2, allergens: ["Gluten", "Lait"], created_at: "", updated_at: "" },
  { id: "3", category_id: "cat-1", name: "Le Chicken Burger", slug: "le-chicken-burger", description: "Filet de poulet pane, salade, tomate, mayo maison", base_price: 890, image_url: null, is_available: true, is_featured: false, display_order: 3, allergens: ["Gluten"], created_at: "", updated_at: "" },
  { id: "4", category_id: "cat-2", name: "Tacos XL", slug: "tacos-xl", description: "Tortilla geante, viande au choix, frites, sauce fromagere", base_price: 890, image_url: null, is_available: true, is_featured: true, display_order: 1, allergens: ["Gluten", "Lait"], created_at: "", updated_at: "" },
  { id: "5", category_id: "cat-2", name: "Tacos XXL", slug: "tacos-xxl", description: "Double tortilla, double viande, frites, double sauce fromagere", base_price: 1190, image_url: null, is_available: true, is_featured: false, display_order: 2, allergens: ["Gluten", "Lait"], created_at: "", updated_at: "" },
  { id: "6", category_id: "cat-3", name: "Wrap Chicken Avocado", slug: "wrap-chicken-avocado", description: "Poulet grille, avocat frais, salade, tomate, sauce ranch", base_price: 850, image_url: null, is_available: true, is_featured: true, display_order: 1, allergens: ["Gluten"], created_at: "", updated_at: "" },
  { id: "7", category_id: "cat-3", name: "Wrap Veggie", slug: "wrap-veggie", description: "Falafels, houmous, legumes grilles, sauce tahini", base_price: 790, image_url: null, is_available: true, is_featured: false, display_order: 2, allergens: ["Gluten", "Sesame"], created_at: "", updated_at: "" },
  { id: "8", category_id: "cat-4", name: "Frites Maison", slug: "frites-maison", description: "Frites fraiches coupees main", base_price: 350, image_url: null, is_available: true, is_featured: false, display_order: 1, allergens: null, created_at: "", updated_at: "" },
  { id: "9", category_id: "cat-4", name: "Nuggets x6", slug: "nuggets-x6", description: "Nuggets de poulet croustillants", base_price: 450, image_url: null, is_available: true, is_featured: false, display_order: 2, allergens: ["Gluten"], created_at: "", updated_at: "" },
  { id: "10", category_id: "cat-5", name: "Coca-Cola 33cl", slug: "coca-cola", description: null, base_price: 250, image_url: null, is_available: true, is_featured: false, display_order: 1, allergens: null, created_at: "", updated_at: "" },
  { id: "11", category_id: "cat-5", name: "Ice Tea Peche 33cl", slug: "ice-tea-peche", description: null, base_price: 250, image_url: null, is_available: true, is_featured: false, display_order: 2, allergens: null, created_at: "", updated_at: "" },
];

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredItems =
    activeCategory === "all"
      ? DEMO_ITEMS
      : DEMO_ITEMS.filter((item) => {
          const cat = DEMO_CATEGORIES.find((c) => c.id === item.category_id);
          return cat?.slug === activeCategory;
        });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Notre Menu
          </h1>
          <p className="mt-2 text-muted-foreground">
            Burgers, tacos, wraps et plus encore
          </p>
        </div>

        {/* Category filter */}
        <div className="sticky top-16 z-30 py-3 bg-background/80 backdrop-blur-lg -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
          <CategoryTabs
            categories={DEMO_CATEGORIES}
            activeSlug={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">Aucun produit dans cette categorie</p>
          </div>
        )}
      </div>
    </div>
  );
}
