import { createClient } from "@/lib/supabase/server";
import {
  MENU_DRINK_SUPPLEMENTS,
  MENU_FRIES_OPTIONS,
} from "@/lib/constants";

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []) as any[];
}

export async function getMenuItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("display_order");

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []) as any[];
}

export async function getCategoriesWithItems() {
  const supabase = await createClient();

  // Run everything in parallel: categories, items, variants (to count
  // per item), and extra-group junctions (to know which items have
  // required/optional selections). This lets the UI decide whether the
  // "+" button should quick-add or open the composer page.
  const [categoriesRes, itemsRes, variantsRes, junctionsRes] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order"),
      supabase.from("menu_items").select("*").order("display_order"),
      supabase.from("menu_item_variants").select("menu_item_id"),
      supabase.from("menu_item_extra_groups").select("menu_item_id"),
    ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (itemsRes.error) throw itemsRes.error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories = (categoriesRes.data || []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = (itemsRes.data || []) as any[];
  const variantRows = (variantsRes.data || []) as { menu_item_id: string }[];
  const junctionRows = (junctionsRes.data || []) as { menu_item_id: string }[];

  const variantCounts = new Map<string, number>();
  for (const v of variantRows) {
    variantCounts.set(
      v.menu_item_id,
      (variantCounts.get(v.menu_item_id) || 0) + 1
    );
  }
  const itemsWithExtras = new Set<string>();
  for (const j of junctionRows) itemsWithExtras.add(j.menu_item_id);

  const items = rawItems.map((item) => ({
    ...item,
    // "has_options" = the item actually requires a choice screen:
    //  - more than 1 variant to pick from, OR
    //  - at least 1 extra group linked.
    has_options:
      (variantCounts.get(item.id) || 0) > 1 || itemsWithExtras.has(item.id),
  }));

  return categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }));
}

export async function getMenuItemBySlug(slug: string) {
  const supabase = await createClient();

  // 1. Fetch item first (needed for the ID)
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, categories(*)")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = data as any;

  // 2. Fetch variants AND extra group junctions in parallel
  const [variantsRes, junctionsRes] = await Promise.all([
    supabase
      .from("menu_item_variants")
      .select("*")
      .eq("menu_item_id", item.id)
      .order("is_default", { ascending: false }),
    supabase
      .from("menu_item_extra_groups")
      .select("extra_group_id")
      .eq("menu_item_id", item.id),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const junctions = (junctionsRes.data || []) as any[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extraGroups: any[] = [];

  if (junctions.length > 0) {
    const groupIds = junctions.map(
      (j: { extra_group_id: string }) => j.extra_group_id
    );

    // 3. Fetch extra groups AND their items in parallel
    const [groupsRes, extraItemsRes] = await Promise.all([
      supabase
        .from("extra_groups")
        .select("*")
        .in("id", groupIds)
        .order("display_order"),
      supabase
        .from("extra_items")
        .select("*")
        .in("extra_group_id", groupIds)
        .eq("is_available", true)
        .order("display_order"),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = (groupsRes.data || []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extraItems = (extraItemsRes.data || []) as any[];

    extraGroups = groups.map((g: Record<string, unknown>) => ({
      ...g,
      items: extraItems.filter(
        (ei: Record<string, unknown>) => ei.extra_group_id === g.id
      ),
    }));
  }

  return {
    ...item,
    variants: variantsRes.data || [],
    extra_groups: extraGroups,
  };
}

export async function getBestSellers(limit = 4) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, slug, base_price, description, image_url, is_featured")
    .eq("is_featured", true)
    .eq("is_available", true)
    .order("display_order")
    .limit(limit);

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []) as any[];
}

/**
 * Fetch the side-options shown when a customer switches an item "en Menu".
 * Returns drinks (from DB, with Red Bull +1€ supplement) + fries (from code constants).
 *
 * Drinks are fetched live so if the owner adds/removes a drink, the menu updates
 * automatically. Fries are constants because there are only 3 and their upgrades
 * are fixed business rules.
 */
export async function getMenuSideOptions() {
  const supabase = await createClient();

  // Find the drinks category id
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "boissons")
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catRow = cat as any;

  let drinks: {
    id: string;
    slug: string;
    name: string;
    image_url: string | null;
    supplement: number;
  }[] = [];

  if (catRow?.id) {
    const { data: drinkRows } = await supabase
      .from("menu_items")
      .select("id, slug, name, image_url")
      .eq("category_id", catRow.id)
      .eq("is_available", true)
      .order("display_order");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (drinkRows || []) as any[];

    drinks = rows.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      image_url: d.image_url,
      // Red Bull (or anything flagged in MENU_DRINK_SUPPLEMENTS) gets a small supplement
      supplement: MENU_DRINK_SUPPLEMENTS[d.slug] ?? 0,
    }));
  }

  const fries = MENU_FRIES_OPTIONS.map((f) => ({
    slug: f.slug,
    label: f.label,
    supplement: f.supplement,
  }));

  return { drinks, fries };
}

export async function getRestaurantSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("*")
    .single();

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any;
}
