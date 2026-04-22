/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { MenuToggleClient, type CategoryWithItems } from "./menu-toggle-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu · Cuisine" };

// Helper : try un select avec les nouvelles colonnes status+unavailable_until
// (migrations 006 appliquees), fallback sur select legacy si elles manquent.
// Retourne les data avec les colonnes synthetisees a default si absent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function selectWithStockFallback(table: any, baseCols: string, newCols: string, orderBy?: string) {
  // Try full select d'abord
  let q = table.select(`${baseCols}, ${newCols}`);
  if (orderBy) q = q.order(orderBy);
  const full = await q;
  if (!full.error) return full;

  // Detect "column does not exist" : PGRST204 ou 42703
  const missingCol =
    full.error?.code === "42703" ||
    full.error?.code === "PGRST204" ||
    /column.*does not exist/i.test(full.error?.message || "");
  if (!missingCol) return full;

  // Fallback : select sans les nouvelles colonnes, synthese a 'in_stock'
  let q2 = table.select(baseCols);
  if (orderBy) q2 = q2.order(orderBy);
  const partial = await q2;
  if (partial.error) return partial;
  return {
    ...partial,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: (partial.data || []).map((r: any) => ({
      ...r,
      availability_status: "in_stock",
      unavailable_until: null,
    })),
  };
}

async function getMenu(): Promise<CategoryWithItems[]> {
  const supabase = createAdminClient() as any;

  const [catsRes, itemsRes, variantsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, display_order")
      .order("display_order"),
    selectWithStockFallback(
      supabase.from("menu_items"),
      "id, category_id, name, base_price, is_available, display_order",
      "availability_status, unavailable_until",
      "display_order",
    ),
    selectWithStockFallback(
      supabase.from("menu_item_variants"),
      "id, menu_item_id, name, price_modifier, is_available",
      "availability_status, unavailable_until",
      "name",
    ),
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
        status: i.availability_status || "in_stock",
        unavailableUntil: i.unavailable_until ?? null,
        variants: variants
          .filter((v) => v.menu_item_id === i.id)
          .map((v) => ({
            id: v.id,
            name: v.name,
            priceModifier: v.price_modifier,
            isAvailable: v.is_available,
            status: v.availability_status || "in_stock",
            unavailableUntil: v.unavailable_until ?? null,
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
    selectWithStockFallback(
      supabase.from("extra_items"),
      "id, extra_group_id, name, price, is_available",
      "availability_status, unavailable_until",
      "name",
    ),
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
        status: i.availability_status || "in_stock",
        unavailableUntil: i.unavailable_until ?? null,
      })),
  }));
}

async function getIngredients() {
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("display_order")
    .order("name");
  // Migration 007 pas encore appliquee → table ingredients absente, on
  // renvoie une liste vide. L'UI affiche "Aucun ingredient" avec un hint.
  if (
    error &&
    (error.code === "42P01" ||
      error.code === "PGRST205" ||
      /not find|does not exist/i.test(error.message || ""))
  ) {
    return [] as any[];
  }
  return (data ?? []) as any[];
}

export default async function KitchenMenuPage() {
  const [categories, extraGroups, ingredients] = await Promise.all([
    getMenu(),
    getExtrasGrouped(),
    getIngredients(),
  ]);
  return (
    <MenuToggleClient
      categories={categories}
      extraGroups={extraGroups}
      ingredients={ingredients.map((i) => ({
        id: i.id,
        name: i.name,
        status: i.availability_status || "in_stock",
        unavailableUntil: i.unavailable_until ?? null,
      }))}
    />
  );
}
