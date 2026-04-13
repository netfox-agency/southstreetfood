import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/customers — staff-only
 * Aggregates unique customers from orders, deduped by phone (primary) or email.
 * Returns: name, phone, email, order_count, total_spent, last_order_date
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

  if (!profile || (profile as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  // Fetch all non-cancelled orders with customer info
  let query = admin
    .from("orders")
    .select(
      "customer_name, customer_phone, customer_email, total, created_at, status, loyalty_points_earned"
    )
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%`
    );
  }

  type OrderRow = {
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    total: number;
    created_at: string;
    status: string;
    loyalty_points_earned: number | null;
  };

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data || []) as unknown as OrderRow[];

  // Deduplicate by phone number (primary key), fallback to email
  const customerMap = new Map<
    string,
    {
      name: string;
      phone: string;
      email: string | null;
      orderCount: number;
      totalSpent: number;
      loyaltyPoints: number;
      lastOrderDate: string;
      firstOrderDate: string;
    }
  >();

  for (const order of orders) {
    // Use phone as primary dedup key, fallback to email, fallback to name
    const key = (
      order.customer_phone ||
      order.customer_email ||
      order.customer_name ||
      "inconnu"
    )
      .trim()
      .toLowerCase();

    const existing = customerMap.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += order.total || 0;
      existing.loyaltyPoints += order.loyalty_points_earned || 0;
      // Keep the most recent name/email (they may update between orders)
      if (order.customer_name) existing.name = order.customer_name;
      if (order.customer_email) existing.email = order.customer_email;
      // Track first and last order dates
      if (order.created_at < existing.firstOrderDate)
        existing.firstOrderDate = order.created_at;
      if (order.created_at > existing.lastOrderDate)
        existing.lastOrderDate = order.created_at;
    } else {
      customerMap.set(key, {
        name: order.customer_name || "Inconnu",
        phone: order.customer_phone || "",
        email: order.customer_email || null,
        orderCount: 1,
        totalSpent: order.total || 0,
        loyaltyPoints: order.loyalty_points_earned || 0,
        lastOrderDate: order.created_at,
        firstOrderDate: order.created_at,
      });
    }
  }

  // Sort by order count descending (most loyal first)
  const customers = Array.from(customerMap.values()).sort(
    (a, b) => b.orderCount - a.orderCount
  );

  return NextResponse.json({
    customers,
    totalCustomers: customers.length,
  });
}
