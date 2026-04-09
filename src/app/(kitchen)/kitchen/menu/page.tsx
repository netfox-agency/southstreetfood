/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { MenuToggleClient, type CategoryWithItems } from "./menu-toggle-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu · Cuisine" };

async function getMenu(): Promise<CategoryWithItems[]> {
  const supabase = createAdminClient() as any;

  const [catsRes, itemsRes, variantsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, display_order")
      .order("display_order"),
    supabase
      .from("menu_items")
      .select("id, category_id, name, base_price, is_available, display_order")
      .order("display_order"),
    supabase
      .from("menu_item_variants")
      .select("id, menu_item_id, name, price_modifier, is_available")
      .order("name"),
  ]);

  const categories = (catsRes.data ?? []) as any[];
  const items = (itemsRes.data ?? []) as any[];
  const variants = (variantsRes.data ?? []) as any[];

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    items: items
      .filter((i) => i.category_id === c.id)
      .map((i) => ({
        id: i.id,
        name: i.name,
        basePrice: i.base_price,
        isAvailable: i.is_available,
        variants: variants
          .filter((v) => v.menu_item_id === i.id)
          .map((v) => ({
            id: v.id,
            name: v.name,
            priceModifier: v.price_modifier,
            isAvailable: v.is_available,
          })),
      })),
  }));
}

async function getExtrasGrouped() {
  const supabase = createAdminClient() as any;
  const [groupsRes, itemsRes] = await Promise.all([
    supabase
      .from("extra_groups")
      .select("id, name, display_order")
      .order("display_order"),
    supabase
      .from("extra_items")
      .select("id, extra_group_id, name, price, is_available")
      .order("name"),
  ]);
  const groups = (groupsRes.data ?? []) as any[];
  const items = (itemsRes.data ?? []) as any[];
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    items: items
      .filter((i) => i.extra_group_id === g.id)
      .map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        isAvailable: i.is_available,
      })),
  }));
}

export default async function KitchenMenuPage() {
  const [categories, extraGroups] = await Promise.all([getMenu(), getExtrasGrouped()]);
  return <MenuToggleClient categories={categories} extraGroups={extraGroups} />;
}
