import { MenuToggleClient } from "@/app/(kitchen)/kitchen/menu/menu-toggle-client";
import {
  getStockMenu,
  getStockExtras,
  getStockIngredients,
} from "@/lib/queries/stock";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gestion stock | Admin SSF" };

/**
 * /admin/stock — Gestion stock complete pour l'admin.
 *
 * Reutilise exactement le composant MenuToggleClient de /kitchen/menu :
 * articles + variants + extras + ingredients avec toggle
 * in_stock / unavailable_today / unavailable_indefinite.
 *
 * hideNav=true parce qu'on est dans le shell admin, pas dans le shell
 * kitchen (admin a sa propre sidebar).
 */
export default async function AdminStockPage() {
  const [categories, extraGroups, ingredients] = await Promise.all([
    getStockMenu(),
    getStockExtras(),
    getStockIngredients(),
  ]);

  return (
    <MenuToggleClient
      categories={categories}
      extraGroups={extraGroups}
      ingredients={ingredients}
      hideNav
    />
  );
}
