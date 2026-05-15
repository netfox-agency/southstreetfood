import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/loyalty/tiers — admin only.
 * Liste TOUS les paliers (actifs + inactifs) avec stats d'usage 30 derniers jours.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!me || (me as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { data: tiers, error } = await admin
    .from("loyalty_rewards")
    .select(
      "id, tier_level, name, description, points_cost, slot_main, slot_fries, slot_drink, slot_dessert, main_categories, excluded_slugs, is_active",
    )
    .eq("reward_type", "tier")
    .order("tier_level", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stats : nombre de redemptions par tier sur 30 derniers jours
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: ordersWithRewards } = await admin
    .from("orders")
    .select("loyalty_reward_id")
    .not("loyalty_reward_id", "is", null)
    .gte("created_at", thirtyDaysAgo);

  const counts = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of (ordersWithRewards ?? []) as any[]) {
    const id = o.loyalty_reward_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = (tiers ?? []).map((t: any) => ({
    ...t,
    redemptions_30d: counts.get(t.id) ?? 0,
  }));

  return NextResponse.json({ tiers: enriched });
}

/**
 * PATCH /api/admin/loyalty/tiers — admin only.
 * Update partiel d'un palier. Body : { id, description?, pointsCost?,
 * isActive?, excludedSlugs? }
 *
 * On ne laisse PAS modifier tier_level, slot_*, main_categories — ce sont
 * les fondations de la PG function consume_loyalty_v3, toucher casserait
 * la coherence. Si le client veut changer ces regles structurelles, faut
 * une nouvelle migration.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!me || (me as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.description === "string" && body.description.trim().length > 0) {
    update.description = body.description.trim().slice(0, 200);
  }
  if (typeof body.pointsCost === "number" && Number.isInteger(body.pointsCost)) {
    if (body.pointsCost < 1 || body.pointsCost > 10000) {
      return NextResponse.json(
        { error: "pointsCost doit etre entre 1 et 10000" },
        { status: 400 },
      );
    }
    update.points_cost = body.pointsCost;
  }
  if (typeof body.isActive === "boolean") {
    update.is_active = body.isActive;
  }
  if (Array.isArray(body.excludedSlugs)) {
    // Sanitize : strings only, max 50 items
    const slugs = body.excludedSlugs
      .filter((s: unknown) => typeof s === "string" && s.length > 0 && s.length < 100)
      .slice(0, 50);
    update.excluded_slugs = slugs;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien a mettre a jour" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (admin as any)
    .from("loyalty_rewards")
    .update(update)
    .eq("id", body.id)
    .eq("reward_type", "tier");

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
