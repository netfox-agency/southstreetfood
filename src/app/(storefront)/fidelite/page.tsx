import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FideliteGuest } from "./fidelite-guest";
import { FideliteConnected } from "./fidelite-connected";
import type { LoyaltyTier } from "@/app/api/loyalty/catalog/route";

export const dynamic = "force-dynamic";

/**
 * /fidelite — Programme fidelite South Street Food
 *
 * 1€ = 1 point. Sur commande terminee uniquement. Compte obligatoire
 * (pas de phone-based, pas de guest loyalty).
 *
 * Server component qui :
 *  - fetch le catalogue (public, toujours affiche)
 *  - check auth : connecte ? → balance + transactions + catalogue
 *                 pas connecte ? → landing explicative + CTAs auth
 */
export default async function FidelitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  // Catalogue (commun aux deux etats)
  const { data: catalogData } = await admin
    .from("loyalty_rewards")
    .select(
      "id, tier_level, name, description, points_cost, slot_main, slot_fries, slot_drink, slot_dessert, main_categories, excluded_slugs",
    )
    .eq("is_active", true)
    .eq("reward_type", "tier")
    .order("tier_level", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catalog: LoyaltyTier[] = (catalogData ?? []).map((r: any) => ({
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

  if (!user) {
    return <FideliteGuest catalog={catalog} />;
  }

  // Connecte : fetch balance + transactions
  const [profileRes, txRes] = await Promise.all([
    admin
      .from("profiles")
      .select("loyalty_points, full_name")
      .eq("id", user.id)
      .single(),
    admin
      .from("loyalty_transactions")
      .select("id, points, description, created_at, order_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = (profileRes as any).data;
  // Si profile absent (rare, anomalie), on redirige vers login pour re-bootstraper
  if ((profileRes as { error: unknown }).error || !profile) {
    redirect("/auth/login?redirect=/fidelite");
  }

  const points: number = profile.loyalty_points ?? 0;
  const firstName: string = (profile.full_name ?? "").split(" ")[0] || "toi";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions = ((txRes as any).data ?? []) as any[];

  return (
    <FideliteConnected
      points={points}
      firstName={firstName}
      catalog={catalog}
      transactions={transactions.map((t) => ({
        id: t.id,
        points: t.points,
        description: t.description ?? "",
        createdAt: t.created_at,
        orderId: t.order_id,
      }))}
    />
  );
}
