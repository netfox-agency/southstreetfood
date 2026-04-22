import { createClient } from "@/lib/supabase/server";
import {
  MENU_DRINK_SUPPLEMENTS,
  MENU_FRIES_OPTIONS,
} from "@/lib/constants";

/**
 * Essaye de fetcher via la VIEW `menu_items_with_availability` (qui calcule
 * effective_available avec la cascade ingredients). Si la VIEW n'existe pas
 * encore (migrations 006-008 pas appliquees cote DB), fallback sur la table
 * `menu_items` brute et synthese des champs manquants.
 *
 * Ce fallback permet au code de se deployer AVANT les migrations SQL sans
 * casser la prod. Une fois les migrations appliquees, la VIEW est utilisee
 * automatiquement (la cascade devient active).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMenuItemsWithAvailability(supabase: any) {
  const viewRes = await supabase
    .from("menu_items_with_availability")
    .select("*")
    .order("display_order");

  if (!viewRes.error) return viewRes;

  // 42P01 = undefined_table, PGRST205 = PostgREST "relation not found"
  const isMissingView =
    viewRes.error?.code === "42P01" ||
    viewRes.error?.code === "PGRST205" ||
    /not find|does not exist/i.test(viewRes.error?.message || "");

  if (!isMissingView) return viewRes;

  // Fallback : lit la table brute et synthese effective_available depuis
  // is_available (pas de cascade ingredient active, migrations en attente)
  const fallback = await supabase
    .from("menu_items")
    .select("*")
    .order("display_order");
  if (fallback.error) return fallback;
  return {
    ...fallback,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: (fallback.data || []).map((row: any) => ({
      ...row,
      effective_available: row.is_available !== false,
      blocking_ingredient: null,
    })),
  };
}

/**
 * Meme pattern pour extras.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchExtraItemsWithAvailability(supabase: any, filter: { in: { column: string; values: string[] } }) {
  const viewRes = await supabase
    .from("extra_items_with_availability")
    .select("*")
    .in(filter.in.column, filter.in.values)
    .order("display_order");

  if (!viewRes.error) return viewRes;
  const isMissingView =
    viewRes.error?.code === "42P01" ||
    viewRes.error?.code === "PGRST205" ||
    /not find|does not exist/i.test(viewRes.error?.message || "");
  if (!isMissingView) return viewRes;

  const fallback = await supabase
    .from("extra_items")
    .select("*")
    .in(filter.in.column, filter.in.values)
    .order("display_order");
  if (fallback.error) return fallback;
  return {
    ...fallback,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: (fallback.data || []).map((row: any) => ({
      ...row,
      effective_available: row.is_available !== false,
      blocking_ingredient: null,
    })),
  };
}

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

  // Run everything in parallel: categories, items (via la VIEW qui calcule
  // effective_available en prenant en compte la cascade ingredients),
  // variants count, et extra-group junctions.
  const [categoriesRes, itemsRes, variantsRes, junctionsRes] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order"),
      fetchMenuItemsWithAvailability(supabase),
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
    // Storefront affiche "Indisponible" quand effective_available=false.
    // On force is_available a refleter le computed (pour que le code
    // existant qui check is_available continue de marcher). L'info brute
    // reste dispo via availability_status et blocking_ingredient.
    is_available: !!item.effective_available,
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

  // 1. Fetch item — try VIEW d'abord (cascade ingredients), fallback table
  //    brute si migrations pas encore appliquees
  let singleRes = await supabase
    .from("menu_items_with_availability")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (
    singleRes.error &&
    (singleRes.error.code === "42P01" ||
      singleRes.error.code === "PGRST205" ||
      /not find|does not exist/i.test(singleRes.error.message || ""))
  ) {
    singleRes = await supabase
      .from("menu_items")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (singleRes.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = singleRes.data as any;
      singleRes = {
        ...singleRes,
        data: {
          ...row,
          effective_available: row.is_available !== false,
          blocking_ingredient: null,
        },
      };
    }
  }

  const { data, error } = singleRes;
  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = data as any;

  // Fetch category separement (la VIEW n'embed pas la categorie)
  const { data: categoryRow } = await supabase
    .from("categories")
    .select("*")
    .eq("id", item.category_id)
    .maybeSingle();

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

    // 3. Fetch extra groups AND their items (via VIEW avec fallback)
    const [groupsRes, extraItemsRes] = await Promise.all([
      supabase
        .from("extra_groups")
        .select("*")
        .in("id", groupIds)
        .order("display_order"),
      fetchExtraItemsWithAvailability(supabase, {
        in: { column: "extra_group_id", values: groupIds },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = (groupsRes.data || []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawExtras = (extraItemsRes.data || []) as any[];

    // Expose is_available comme effective_available pour que l'UI existante
    // filtre les OOS (propages par cascade ingredients). Les vraies extras
    // OOS sont retirees de la liste proposee au client.
    const extraItems = rawExtras
      .map((e) => ({ ...e, is_available: !!e.effective_available }))
      .filter((e) => e.is_available);

    extraGroups = groups.map((g: Record<string, unknown>) => ({
      ...g,
      items: extraItems.filter(
        (ei: Record<string, unknown>) => ei.extra_group_id === g.id
      ),
    }));
  }

  // Sync is_available avec effective_available pour rester cohérent avec
  // le comportement legacy. Le storefront check is_available pour afficher
  // "Indisponible". Les variants heritent de leur propre statut.
  return {
    ...item,
    is_available: !!item.effective_available,
    categories: categoryRow,
    variants: variantsRes.data || [],
    extra_groups: extraGroups,
  };
}

export async function getBestSellers(limit = 4) {
  const supabase = await createClient();
  // VIEW avec effective_available (cascade ingredients), fallback table brute
  let res = await supabase
    .from("menu_items_with_availability")
    .select("id, name, slug, base_price, description, image_url, is_featured, effective_available")
    .eq("is_featured", true)
    .eq("effective_available", true)
    .order("display_order")
    .limit(limit);

  if (
    res.error &&
    (res.error.code === "42P01" ||
      res.error.code === "PGRST205" ||
      /not find|does not exist/i.test(res.error.message || ""))
  ) {
    res = await supabase
      .from("menu_items")
      .select("id, name, slug, base_price, description, image_url, is_featured")
      .eq("is_featured", true)
      .eq("is_available", true)
      .order("display_order")
      .limit(limit);
  }

  if (res.error) throw res.error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res.data || []) as any[];
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
