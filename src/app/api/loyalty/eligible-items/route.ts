import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/loyalty/eligible-items?tierId=UUID&slot=main|fries|drink|dessert
 *
 * Retourne les items eligibles pour un slot d'un palier donne.
 *
 *  - slot=main    → items dans main_categories du palier, MOINS excluded_slugs
 *  - slot=fries   → categorie "patate"
 *  - slot=drink   → categorie "boissons"
 *  - slot=dessert → categorie "desserts"
 *
 * Filtre is_available=true (jamais offrir un item indisponible).
 *
 * Cache 60s : les items changent (stock, dispo), faut etre reactif.
 */
export type EligibleItem = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  /** Prix de l'item (informationnel pour la card "valeur 8€") */
  basePrice: number;
  /** Category slug pour affichage groupe si besoin */
  categorySlug: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tierId = searchParams.get("tierId");
  const slot = searchParams.get("slot");

  if (!tierId || !slot) {
    return NextResponse.json(
      { error: "tierId et slot requis" },
      { status: 400 },
    );
  }
  if (!["main", "fries", "drink", "dessert"].includes(slot)) {
    return NextResponse.json({ error: "slot invalide" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Recupere le palier (pour les regles d'eligibilite si slot=main)
  // Cast en any : les types generes Supabase n'ont pas encore les nouvelles
  // colonnes slot_*, main_categories, excluded_slugs apres migration 012.
  const { data: tierRowRaw, error: tierErr } = await admin
    .from("loyalty_rewards")
    .select(
      "id, tier_level, slot_main, slot_fries, slot_drink, slot_dessert, main_categories, excluded_slugs",
    )
    .eq("id", tierId)
    .eq("is_active", true)
    .eq("reward_type", "tier")
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tierRow = tierRowRaw as any;

  if (tierErr || !tierRow) {
    return NextResponse.json(
      { error: "palier introuvable" },
      { status: 404 },
    );
  }

  // Verifie que le slot demande est bien dans le palier (securite)
  const slotMap = {
    main: tierRow.slot_main,
    fries: tierRow.slot_fries,
    drink: tierRow.slot_drink,
    dessert: tierRow.slot_dessert,
  } as const;
  if (!slotMap[slot as keyof typeof slotMap]) {
    return NextResponse.json(
      { error: "slot non disponible pour ce palier" },
      { status: 400 },
    );
  }

  // Determine la categorie cible selon le slot
  // Pour main : utilise main_categories du palier (multiples)
  // Pour autres : categorie unique fixe
  const categorySlugs: string[] =
    slot === "main"
      ? tierRow.main_categories ?? []
      : slot === "fries"
        ? ["patate"]
        : slot === "drink"
          ? ["boissons"]
          : ["desserts"];

  if (categorySlugs.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Resolve category IDs from slugs
  const { data: cats } = await admin
    .from("categories")
    .select("id, slug")
    .in("slug", categorySlugs);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catIds = ((cats ?? []) as any[]).map((c) => c.id);
  if (catIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Fetch items eligibles
  const { data: itemsData, error: itemsErr } = await admin
    .from("menu_items")
    .select(
      "id, name, slug, image_url, base_price, category_id, categories:category_id(slug)",
    )
    .in("category_id", catIds)
    .eq("is_available", true)
    .order("display_order", { ascending: true });

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  const excluded = new Set(tierRow.excluded_slugs ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: EligibleItem[] = (itemsData ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((it: any) => slot !== "main" || !excluded.has(it.slug))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((it: any) => ({
      id: it.id,
      name: it.name,
      slug: it.slug,
      imageUrl: it.image_url,
      basePrice: it.base_price,
      categorySlug: it.categories?.slug ?? "",
    }));

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
  );
}
