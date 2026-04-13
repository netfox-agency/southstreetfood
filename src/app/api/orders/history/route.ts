import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/orders/history — staff-only
 * Returns orders for a given date with summary stats.
 * Query: ?date=YYYY-MM-DD (defaults to yesterday)
 */
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  // Default to yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = dateParam || yesterday.toISOString().split("T")[0];

  const startOfDay = `${targetDate}T00:00:00.000Z`;
  const endOfDay = `${targetDate}T23:59:59.999Z`;

  type OrderRow = {
    id: string;
    order_number: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    total: number;
    subtotal: number;
    delivery_fee: number;
    status: string;
    order_type: string;
    created_at: string;
    notes: string | null;
  };

  const { data, error } = await admin
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, customer_email, total, subtotal, delivery_fee, status, order_type, created_at, notes"
    )
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = (data || []) as unknown as OrderRow[];

  // Exclude cancelled from revenue stats
  const completed = all.filter((o) => o.status !== "cancelled");

  const stats = {
    totalOrders: all.length,
    completedOrders: completed.length,
    cancelledOrders: all.length - completed.length,
    totalRevenue: completed.reduce((sum, o) => sum + (o.total || 0), 0),
    totalDeliveryFees: completed.reduce(
      (sum, o) => sum + (o.delivery_fee || 0),
      0
    ),
    avgOrderValue:
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, o) => sum + (o.total || 0), 0) /
              completed.length
          )
        : 0,
    byType: {
      dine_in: completed.filter((o) => o.order_type === "dine_in").length,
      collect: completed.filter((o) => o.order_type === "collect").length,
      delivery: completed.filter((o) => o.order_type === "delivery").length,
    },
  };

  return NextResponse.json({ orders: all, stats, date: targetDate });
}
