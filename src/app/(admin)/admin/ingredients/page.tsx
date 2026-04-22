import { createAdminClient } from "@/lib/supabase/admin";
import { IngredientsAdminClient } from "./ingredients-admin-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ingredients | Admin SSF" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default async function AdminIngredientsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const [ingRes, miLinksRes, exLinksRes, itemsRes, extrasRes] = await Promise.all(
    [
      supabase
        .from("ingredients")
        .select("*")
        .order("display_order")
        .order("name"),
      supabase.from("menu_item_ingredients").select("*"),
      supabase.from("extra_item_ingredients").select("*"),
      supabase
        .from("menu_items")
        .select("id, name, category_id")
        .order("display_order"),
      supabase
        .from("extra_items")
        .select("id, name, extra_group_id")
        .order("name"),
    ],
  );

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
