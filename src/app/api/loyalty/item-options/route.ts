import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/loyalty/item-options?itemId=UUID
 *
 * Retourne les options (variantes + groupes de suppléments) d'un item, pour
 * que le picker fidélité laisse le client personnaliser sa récompense
 * exactement comme une commande normale (ex : Big Cheese → choix steak/poulet
 * + sauces). Ne retourne que les éléments disponibles.
 *
 * Les prix ne comptent pas (la récompense est offerte), mais on renvoie les
 * groupes avec leurs règles min/max pour piloter l'UI (radio vs checkbox).
 */
export type OptionExtraItem = { id: string; name: string };
export type OptionGroup = {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number | null;
  items: OptionExtraItem[];
};
export type ItemVariant = { id: string; name: string };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "itemId requis" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Variantes + jonctions groupes en parallèle
  const [variantsRes, junctionsRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from("menu_item_variants")
      .select("id, name, is_available")
      .eq("menu_item_id", itemId)
      .order("is_default", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from("menu_item_extra_groups")
      .select("extra_group_id")
      .eq("menu_item_id", itemId),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const junctions = (junctionsRes.data || []) as any[];
  const groupIds = junctions.map((j) => j.extra_group_id);

  let extraGroups: OptionGroup[] = [];
  if (groupIds.length > 0) {
    const [groupsRes, itemsRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any)
        .from("extra_groups")
        .select("id, name, min_selections, max_selections")
        .in("id", groupIds)
        .order("display_order"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any)
        .from("extra_items")
        .select("id, name, extra_group_id, is_available")
        .in("extra_group_id", groupIds)
        .order("display_order"),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = (groupsRes.data || []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = ((itemsRes.data || []) as any[]).filter(
      (i) => i.is_available !== false,
    );

    extraGroups = groups.map((g) => ({
      id: g.id,
      name: g.name,
      minSelections: g.min_selections ?? 0,
      maxSelections: g.max_selections ?? null,
      items: items
        .filter((i) => i.extra_group_id === g.id)
        .map((i) => ({ id: i.id, name: i.name })),
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variants: ItemVariant[] = ((variantsRes.data || []) as any[])
    .filter((v) => v.is_available !== false)
    .map((v) => ({ id: v.id, name: v.name }));

  return NextResponse.json(
    { variants, extraGroups },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
  );
}
