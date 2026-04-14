import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/loyalty/balance?phone=06XXXXXXXX — public
 * Returns loyalty points balance for a phone number.
 * Balance = SUM(loyalty_points_earned) from all completed orders for that phone.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit("loyalty.balance", ip, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes, réessayez dans quelques secondes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone")?.trim();

  if (!phone) {
    return NextResponse.json({ error: "phone requis" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Sum all loyalty_points_earned for this phone number on non-cancelled orders
  const { data, error } = await admin
    .from("orders")
    .select("loyalty_points_earned")
    .eq("customer_phone", phone)
    .not("status", "eq", "cancelled");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = (data || []) as any[];
  const totalPoints = orders.reduce(
    (sum, o) => sum + (o.loyalty_points_earned || 0),
    0
  );
  const totalOrders = orders.length;

  return NextResponse.json({
    phone,
    totalPoints,
    totalOrders,
  });
}
