"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItemCard } from "./menu-item-card";
import type { MenuItem } from "@/types/menu";

// Demo data for initial build - will be replaced by Supabase fetch
const DEMO_ITEMS: MenuItem[] = [
  {
    id: "1",
    category_id: "cat-1",
    name: "Le Classic Smash",
    slug: "le-classic-smash",
    description: "Double smash patty, cheddar fondu, sauce maison, oignons caramelises",
    base_price: 990,
    image_url: null,
    is_available: true,
    is_featured: true,
    display_order: 1,
    allergens: ["Gluten", "Lait"],
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    category_id: "cat-2",
    name: "Tacos XL",
    slug: "tacos-xl",
    description: "Tortilla geante, viande au choix, frites, sauce fromagere",
    base_price: 890,
    image_url: null,
    is_available: true,
    is_featured: true,
    display_order: 2,
    allergens: ["Gluten", "Lait"],
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    category_id: "cat-3",
    name: "Wrap Chicken Avocado",
    slug: "wrap-chicken-avocado",
    description: "Poulet grille, avocat frais, salade, tomate, sauce ranch",
    base_price: 850,
    image_url: null,
    is_available: true,
    is_featured: true,
    display_order: 3,
    allergens: ["Gluten"],
    created_at: "",
    updated_at: "",
  },
  {
    id: "4",
    category_id: "cat-1",
    name: "Le South Burger",
    slug: "le-south-burger",
    description: "Notre signature: triple viande, bacon croustillant, jalapenos, sauce BBQ fumee",
    base_price: 1290,
    image_url: null,
    is_available: true,
    is_featured: true,
    display_order: 4,
    allergens: ["Gluten", "Lait"],
    created_at: "",
    updated_at: "",
  },
];

export function FeaturedItems() {
  const items = DEMO_ITEMS;

  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Les plus demandes
            </h2>
            <p className="mt-2 text-muted-foreground">
              Nos best-sellers, prepares avec amour
            </p>
          </div>
          <Link href="/menu" className="hidden sm:block">
            <Button variant="ghost" className="text-brand-purple">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <MenuItemCard item={item} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/menu">
            <Button variant="outline" className="w-full">
              Voir tout le menu
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
