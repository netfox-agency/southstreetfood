import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LoyaltyCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  imageUrl: string | null;
  menuItemId: string | null;
  menuItemPrice: number | null;
  rewardType: string;
  /** Pour les combo_menu : liste des menu_item_ids a ajouter gratuitement. */
  bundleMenuItemIds: string[] | null;
};

/**
 * GET /api/loyalty/catalog — public.
 *
 * Liste des recompenses actives. On joint menu_items pour recuperer
 * le prix reel (utile cote UI pour afficher "valeur 8€") + image
 * produit si la recompense n'a pas d'image_url custom.
 *
 * Cache 60s : le catalogue change rarement, inutile de taper la DB
 * a chaque chargement du menu fidelite.
 */
export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("loyalty_rewards")
    .select(
      "id, name, description, points_cost, reward_type, image_url, reward_menu_item_id, bundle_menu_item_ids, menu_items:reward_menu_item_id(base_price, image_url)",
    )
    .eq("is_active", true)
    .order("points_cost", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rewards: LoyaltyCatalogItem[] = (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    pointsCost: r.points_cost,
    imageUrl: r.image_url ?? r.menu_items?.image_url ?? null,
    menuItemId: r.reward_menu_item_id,
    menuItemPrice: r.menu_items?.base_price ?? null,
    rewardType: r.reward_type,
    bundleMenuItemIds: r.bundle_menu_item_ids ?? null,
  }));

  return NextResponse.json(
    { rewards },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
  );
}
