import { createClient } from "@/lib/supabase/server";

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
  const [categories, items] = await Promise.all([
    getCategories(),
    getMenuItems(),
  ]);

  return categories.map((cat: Record<string, unknown>) => ({
    ...cat,
    items: items.filter((item: Record<string, unknown>) => item.category_id === cat.id),
  }));
}

export async function getMenuItemBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_items")
    .select("*, categories(*)")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = data as any;

  // Fetch variants
  const { data: variants } = await supabase
    .from("menu_item_variants")
    .select("*")
    .eq("menu_item_id", item.id)
    .order("is_default", { ascending: false });

  // Fetch extra groups linked to this item
  const { data: junctionsRaw } = await supabase
    .from("menu_item_extra_groups")
    .select("extra_group_id")
    .eq("menu_item_id", item.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const junctions = (junctionsRaw || []) as any[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extraGroups: any[] = [];

  if (junctions.length > 0) {
    const groupIds = junctions.map((j: { extra_group_id: string }) => j.extra_group_id);

    const { data: groupsRaw } = await supabase
      .from("extra_groups")
      .select("*")
      .in("id", groupIds)
      .order("display_order");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = (groupsRaw || []) as any[];

    if (groups.length > 0) {
      const { data: extraItemsRaw } = await supabase
        .from("extra_items")
        .select("*")
        .in("extra_group_id", groupIds)
        .eq("is_available", true)
        .order("display_order");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extraItems = (extraItemsRaw || []) as any[];

      extraGroups = groups.map((g: Record<string, unknown>) => ({
        ...g,
        items: extraItems.filter((ei: Record<string, unknown>) => ei.extra_group_id === g.id),
      }));
    }
  }

  return {
    ...item,
    variants: variants || [],
    extra_groups: extraGroups,
  };
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
