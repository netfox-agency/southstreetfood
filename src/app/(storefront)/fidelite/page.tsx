import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FideliteGuest } from "./fidelite-guest";
import { FideliteConnected } from "./fidelite-connected";
import type { LoyaltyCatalogItem } from "@/app/api/loyalty/catalog/route";

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
      "id, name, description, points_cost, reward_type, image_url, reward_menu_item_id, bundle_menu_item_ids, menu_items:reward_menu_item_id(base_price, image_url)",
    )
    .eq("is_active", true)
    .order("points_cost", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catalog: LoyaltyCatalogItem[] = (catalogData ?? []).map((r: any) => ({
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
