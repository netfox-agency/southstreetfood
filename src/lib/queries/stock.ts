/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CategoryWithItems,
  ExtraGroup,
  Ingredient,
} from "@/app/(kitchen)/kitchen/menu/menu-toggle-client";

/**
 * Fetch helpers pour la page "Gestion stock" (menu + extras + ingredients).
 * Utilises par /kitchen/menu ET /admin/stock pour ne pas dupliquer.
 *
 * selectWithStockFallback tolere l'absence des colonnes availability_status
 * et unavailable_until (migrations 006/007 non appliquees) et retourne
 * alors un default 'in_stock' pour que l'UI ne crash pas.
 */

async function selectWithStockFallback(
  table: any,
  baseCols: string,
  newCols: string,
  orderBy?: string,
) {
  let q = table.select(`${baseCols}, ${newCols}`);
  if (orderBy) q = q.order(orderBy);
  const full = await q;
  if (!full.error) return full;

  const missingCol =
    full.error?.code === "42703" ||
    full.error?.code === "PGRST204" ||
    /column.*does not exist/i.test(full.error?.message || "");
  if (!missingCol) return full;

  let q2 = table.select(baseCols);
  if (orderBy) q2 = q2.order(orderBy);
  const partial = await q2;
  if (partial.error) return partial;
  return {
    ...partial,
    data: (partial.data || []).map((r: any) => ({
      ...r,
      availability_status: "in_stock",
      unavailable_until: null,
    })),
  };
}

export async function getStockMenu(): Promise<CategoryWithItems[]> {
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

export async function getStockExtras(): Promise<ExtraGroup[]> {
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

export async function getStockIngredients(): Promise<Ingredient[]> {
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("display_order")
    .order("name");
  if (
    error &&
    (error.code === "42P01" ||
      error.code === "PGRST205" ||
      /not find|does not exist/i.test(error.message || ""))
  ) {
    return [];
  }
  return ((data ?? []) as any[]).map((i) => ({
    id: i.id,
    name: i.name,
    status: i.availability_status || "in_stock",
    unavailableUntil: i.unavailable_until ?? null,
  }));
}
