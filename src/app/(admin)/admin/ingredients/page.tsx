import { createAdminClient } from "@/lib/supabase/admin";
import { IngredientsAdminClient } from "./ingredients-admin-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ingredients | Admin SSF" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function AdminIngredientsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // Helpers qui tolerent les tables ingredients/junctions absentes (avant
  // migration 007). Retournent [] silencieusement pour que l'UI affiche
  // "Aucun ingredient" + hint au lieu d'un 500.
  const safeList = async (table: string, query: (b: any) => any) => {
    const b = supabase.from(table);
    const { data, error } = await query(b);
    if (
      error &&
      (error.code === "42P01" ||
        error.code === "PGRST205" ||
        /not find|does not exist/i.test(error.message || ""))
    ) {
      return [] as any[];
    }
    return (data ?? []) as any[];
  };

  const [ingredientsData, miLinksData, exLinksData, itemsData, extrasData] =
    await Promise.all([
      safeList("ingredients", (b) =>
        b.select("*").order("display_order").order("name"),
      ),
      safeList("menu_item_ingredients", (b) => b.select("*")),
      safeList("extra_item_ingredients", (b) => b.select("*")),
      safeList("menu_items", (b) =>
        b.select("id, name, category_id").order("display_order"),
      ),
      safeList("extra_items", (b) =>
        b.select("id, name, extra_group_id").order("name"),
      ),
    ]);

  // Normalize aux anciens noms utilises plus bas
  const ingRes = { data: ingredientsData };
  const miLinksRes = { data: miLinksData };
  const exLinksRes = { data: exLinksData };
  const itemsRes = { data: itemsData };
  const extrasRes = { data: extrasData };

  const ingredients = ((ingRes.data || []) as Any[]).map((ing: Any) => ({
    id: ing.id,
    name: ing.name,
    status: ing.availability_status || "in_stock",
    unavailableUntil: ing.unavailable_until ?? null,
    displayOrder: ing.display_order ?? 0,
    menuItemIds: ((miLinksRes.data || []) as Any[])
      .filter((l: Any) => l.ingredient_id === ing.id)
      .map((l: Any) => l.menu_item_id),
    extraIds: ((exLinksRes.data || []) as Any[])
      .filter((l: Any) => l.ingredient_id === ing.id)
      .map((l: Any) => l.extra_id),
  }));

  const menuItems = ((itemsRes.data || []) as Any[]).map((i: Any) => ({
    id: i.id,
    name: i.name,
  }));
  const extras = ((extrasRes.data || []) as Any[]).map((e: Any) => ({
    id: e.id,
    name: e.name,
  }));

  return (
    <IngredientsAdminClient
      ingredients={ingredients}
      menuItems={menuItems}
      extras={extras}
    />
  );
}
