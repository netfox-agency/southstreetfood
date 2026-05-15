import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LoyaltyAdminClient } from "./loyalty-admin-client";

export const dynamic = "force-dynamic";

/**
 * /admin/loyalty — gestion des 6 paliers fidelite + stats + octroi manuel.
 *
 * Server component : check auth admin + fetch initial data, puis delegue
 * a un client component pour l'edition interactive.
 */
export default async function AdminLoyaltyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/admin/loyalty");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile as { role: string }).role !== "admin") {
    redirect("/");
  }

  // Fetch tiers + stats
  const { data: tiersData } = await admin
    .from("loyalty_rewards")
    .select(
      "id, tier_level, name, description, points_cost, slot_main, slot_fries, slot_drink, slot_dessert, main_categories, excluded_slugs, is_active",
    )
    .eq("reward_type", "tier")
    .order("tier_level", { ascending: true });

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: ordersWithRewards } = await admin
    .from("orders")
    .select("loyalty_reward_id")
    .not("loyalty_reward_id", "is", null)
    .gte("created_at", thirtyDaysAgo);

  const redemptionCounts = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of (ordersWithRewards ?? []) as any[]) {
    redemptionCounts.set(
      o.loyalty_reward_id,
      (redemptionCounts.get(o.loyalty_reward_id) ?? 0) + 1,
    );
  }

  // Fetch tous les items du menu (pour le multi-select des exclusions)
  // Limite aux categories eligibles aux paliers main : burgers/wraps/compose
  const { data: catsData } = await admin
    .from("categories")
    .select("id, slug, name")
    .in("slug", ["burgers-premium", "wraps", "compose"]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cats = (catsData ?? []) as any[];
  const catIds = cats.map((c) => c.id);

  const { data: itemsData } = catIds.length
    ? await admin
        .from("menu_items")
        .select("id, name, slug, category_id")
        .in("category_id", catIds)
        .order("display_order")
    : { data: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((itemsData ?? []) as any[]).map((i) => ({
    id: i.id,
    name: i.name,
    slug: i.slug,
    categoryName: cats.find((c) => c.id === i.category_id)?.name ?? "—",
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tiers = ((tiersData ?? []) as any[]).map((t) => ({
    id: t.id,
    tierLevel: t.tier_level,
    name: t.name,
    description: t.description ?? "",
    pointsCost: t.points_cost,
    slots: {
      main: !!t.slot_main,
      fries: !!t.slot_fries,
      drink: !!t.slot_drink,
      dessert: !!t.slot_dessert,
    },
    mainCategories: t.main_categories ?? [],
    excludedSlugs: t.excluded_slugs ?? [],
    isActive: !!t.is_active,
    redemptions30d: redemptionCounts.get(t.id) ?? 0,
  }));

  return <LoyaltyAdminClient tiers={tiers} eligibleItems={items} />;
}
