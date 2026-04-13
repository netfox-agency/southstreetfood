import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { LOYALTY } from "@/lib/constants";

/**
 * POST /api/loyalty/award — staff-only
 * Awards loyalty points when an order is completed (picked_up / delivered).
 * Idempotent: won't double-award if points are already set.
 * Body: { orderId: string }
 */
export async function POST(request: NextRequest) {
  // Auth check: must be admin or kitchen staff
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
    return NextResponse.json(
      { error: "orderId requis" },
      { status: 400 }
    );
  }

  // Fetch order
  const { data: orderData, error: orderError } = await admin
    .from("orders")
    .select("id, total, status, loyalty_points_earned, customer_phone")
    .eq("id", orderId)
    .single();

  if (orderError || !orderData) {
    return NextResponse.json(
      { error: "Commande introuvable" },
      { status: 404 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = orderData as any;

  // Guard: only award for terminal statuses
  const terminalStatuses = ["picked_up", "delivered", "out_for_delivery"];
  if (!terminalStatuses.includes(order.status)) {
    return NextResponse.json(
      { error: "La commande n'est pas encore terminee" },
      { status: 400 }
    );
  }

  // Guard: already awarded (idempotent)
  if (order.loyalty_points_earned && order.loyalty_points_earned > 0) {
    return NextResponse.json({
      pointsAwarded: order.loyalty_points_earned,
      alreadyAwarded: true,
    });
  }

  // Calculate points: total (in cents) → euros → points
  const euros = Math.floor(order.total / 100);
  const points = euros * LOYALTY.pointsPerEuro;

  if (points <= 0) {
    return NextResponse.json({ pointsAwarded: 0, alreadyAwarded: false });
  }

  // Update order with points earned
  const { error: updateError } = await admin
    .from("orders")
    .update({ loyalty_points_earned: points } as never)
    .eq("id", orderId);

  if (updateError) {
    return NextResponse.json(
      { error: "Erreur lors de l'attribution des points" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    pointsAwarded: points,
    alreadyAwarded: false,
  });
}
