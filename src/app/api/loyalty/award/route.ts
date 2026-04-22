import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { LOYALTY } from "@/lib/constants";

/**
 * POST /api/loyalty/award — staff-only.
 *
 * Attribue les points fidelite quand une commande est marquee terminee
 * (picked_up / delivered / out_for_delivery). Ecrit a la fois :
 *  - orders.loyalty_points_earned  (trace, idempotent)
 *  - loyalty_transactions           (ledger, audit trail)
 *  - profiles.loyalty_points        (cache du solde pour lecture rapide)
 *
 * Ratio : 1 euro = 1 point. Seules les commandes liees a un user_id
 * (client connecte) generent des points. Pas de compte, pas de points.
 *
 * Idempotent : si loyalty_points_earned > 0, on ne redistribue pas.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["admin", "kitchen"].includes((profile as { role: string }).role)
  ) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await request.json();
  const orderId = body.orderId;
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId requis" }, { status: 400 });
  }

  const { data: orderData, error: orderError } = await admin
    .from("orders")
    .select("id, total, status, loyalty_points_earned, user_id")
    .eq("id", orderId)
    .single();

  if (orderError || !orderData) {
    return NextResponse.json(
      { error: "Commande introuvable" },
      { status: 404 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = orderData as any;

  const terminalStatuses = ["picked_up", "delivered", "out_for_delivery"];
  if (!terminalStatuses.includes(order.status)) {
    return NextResponse.json(
      { error: "La commande n'est pas encore terminee" },
      { status: 400 },
    );
  }

  // Pas de compte, pas de points. Les guest n'en cumulent jamais.
  if (!order.user_id) {
    return NextResponse.json({ pointsAwarded: 0, reason: "guest_order" });
  }

  // Idempotent : deja credite, on ne refait pas
  if (order.loyalty_points_earned && order.loyalty_points_earned > 0) {
    return NextResponse.json({
      pointsAwarded: order.loyalty_points_earned,
      alreadyAwarded: true,
    });
  }

  // 1 euro = 1 point. total est en centimes.
  const euros = Math.floor(order.total / 100);
  const points = euros * LOYALTY.pointsPerEuro;

  if (points <= 0) {
    return NextResponse.json({ pointsAwarded: 0, alreadyAwarded: false });
  }

  // 1. Trace sur la commande
  const { error: updateError } = await admin
    .from("orders")
    .update({ loyalty_points_earned: points } as never)
    .eq("id", orderId);

  if (updateError) {
    return NextResponse.json(
      { error: "Erreur lors de l'attribution des points" },
      { status: 500 },
    );
  }

  // 2. Ledger (audit trail)
  await admin
    .from("loyalty_transactions")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      user_id: order.user_id,
      order_id: orderId,
      points,
      description: "Points gagnes",
    } as never);

  // 3. Cache du solde (profiles.loyalty_points += points)
  const { data: currentProfile } = await admin
    .from("profiles")
    .select("loyalty_points")
    .eq("id", order.user_id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentBalance = (currentProfile as any)?.loyalty_points ?? 0;
  await admin
    .from("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ loyalty_points: currentBalance + points } as never)
    .eq("id", order.user_id);

  return NextResponse.json({
    pointsAwarded: points,
    alreadyAwarded: false,
  });
}
