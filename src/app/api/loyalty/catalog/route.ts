import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Loyalty v3 : Tier-based system.
 *
 * Un palier = une recompense avec des "slots" (main/fries/drink/dessert)
 * et des regles d'eligibilite (categories autorisees, items exclus).
 * Le client choisit les items au moment du redemption via le picker.
 */
export type LoyaltyTier = {
  id: string;
  tierLevel: number;
  name: string;
  description: string | null;
  pointsCost: number;
  slots: {
    main: boolean;
    fries: boolean;
    drink: boolean;
    dessert: boolean;
  };
  /** Categories slugs eligibles pour le slot main (vide = tous) */
  mainCategories: string[];
  /** Slugs d'items exclus du slot main (Montagnard/180/XL aux paliers < 6) */
  excludedSlugs: string[];
};

// Backwards-compat alias for old code paths that still import LoyaltyCatalogItem.
// On garde le type pour ne pas casser l'import dans /fidelite (qu'on va refondre).
export type LoyaltyCatalogItem = LoyaltyTier;

/**
 * GET /api/loyalty/catalog — public.
 *
 * Retourne les 6 paliers actifs avec leurs slots et regles.
 * Cache 5min : les paliers changent tres rarement.
 */
export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("loyalty_rewards")
    .select(
      "id, tier_level, name, description, points_cost, slot_main, slot_fries, slot_drink, slot_dessert, main_categories, excluded_slugs",
    )
    .eq("is_active", true)
    .eq("reward_type", "tier")
    .order("tier_level", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tiers: LoyaltyTier[] = (data ?? []).map((r: any) => ({
    id: r.id,
    tierLevel: r.tier_level,
    name: r.name,
    description: r.description,
    pointsCost: r.points_cost,
    slots: {
      main: !!r.slot_main,
      fries: !!r.slot_fries,
      drink: !!r.slot_drink,
      dessert: !!r.slot_dessert,
    },
    mainCategories: r.main_categories ?? [],
    excludedSlugs: r.excluded_slugs ?? [],
  }));

  return NextResponse.json(
    { tiers },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } },
  );
}
