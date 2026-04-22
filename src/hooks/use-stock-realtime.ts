"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe a Supabase Realtime pour le feature gestion de stock :
 * quand un ingredient, menu_item, variant, extra ou junction change, on
 * declenche un router.refresh() pour re-fetcher les queries server-side
 * (getCategoriesWithItems, etc.) qui lisent les VIEWs effective_available.
 *
 * Debounced : si plusieurs events arrivent en moins de 400ms (typique
 * quand un staff toggle plusieurs items en rafale), on n'en declenche
 * qu'un seul refresh.
 *
 * Utilise sur les pages storefront qui affichent des items (menu + item
 * sheet). Pas besoin sur le cart : le pricing server-side rejettera si
 * un item est OOS au moment du submit.
 */
export function useStockRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const triggerRefresh = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        router.refresh();
      }, 400);
    };

    const channel = supabase
      .channel("stock-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingredients" },
        triggerRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menu_items" },
        triggerRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menu_item_variants" },
        triggerRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "extra_items" },
        triggerRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_item_ingredients" },
        triggerRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "extra_item_ingredients" },
        triggerRefresh,
      )
      .subscribe();

    return () => {
      if (timeout) clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [router]);
}
