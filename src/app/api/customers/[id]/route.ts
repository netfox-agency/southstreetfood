import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/customers/[id] — admin-only.
 *
 * Fiche detail d'un client. L'id encode le mode de lookup :
 *  - "user:<uuid>"   → client connecte (profiles)
 *  - "phone:<digits>"→ guest dedup par telephone
 *  - "email:<addr>"  → guest dedup par email
 *
 * Retourne : infos + orders + transactions fidelite (si compte).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: meProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!meProfile || (meProfile as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const [kind, ...rest] = id.split(":");
  const value = rest.join(":");

  if (!value) {
    return NextResponse.json({ error: "Id invalide" }, { status: 400 });
  }

  // Fetch orders qui matchent le critere
  const orderQuery = admin
    .from("orders")
    .select(
      "id, order_number, order_type, status, total, subtotal, delivery_fee, customer_name, customer_phone, customer_email, notes, loyalty_points_earned, loyalty_reward_id, created_at, user_id",
    )
    .order("created_at", { ascending: false });

  let ordersRes;
  if (kind === "user") {
    ordersRes = await orderQuery.eq("user_id", value);
  } else if (kind === "phone") {
    ordersRes = await orderQuery.eq("customer_phone", value);
  } else if (kind === "email") {
    ordersRes = await orderQuery.eq("customer_email", value);
  } else {
    return NextResponse.json({ error: "Type d'id inconnu" }, { status: 400 });
  }

  if (ordersRes.error) {
    return NextResponse.json(
      { error: ordersRes.error.message },
      { status: 500 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = (ordersRes.data ?? []) as any[];

  // Profile + transactions si compte
  let profile: {
    id: string;
    full_name: string | null;
    phone: string | null;
    loyalty_points: number;
    created_at: string | null;
  } | null = null;
  let transactions: Array<{
    id: string;
    points: number;
    description: string | null;
    created_at: string | null;
    order_id: string | null;
  }> = [];
  let email: string | null = null;

  if (kind === "user") {
    const [{ data: profileRow }, { data: txRows }, { data: authUser }] =
      await Promise.all([
        admin
          .from("profiles")
          .select("id, full_name, phone, loyalty_points, created_at")
          .eq("id", value)
          .single(),
        admin
          .from("loyalty_transactions")
          .select("id, points, description, created_at, order_id")
          .eq("user_id", value)
          .order("created_at", { ascending: false })
          .limit(50),
        admin.auth.admin.getUserById(value),
      ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile = (profileRow as any) ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transactions = (txRows as any[]) ?? [];
    email = authUser?.user?.email ?? null;
  }

  // Stats
  const nonCancelled = orders.filter((o) => o.status !== "cancelled");
  const totalSpent = nonCancelled.reduce((s, o) => s + (o.total || 0), 0);
  const orderCount = nonCancelled.length;
  const lastOrderDate = orders[0]?.created_at ?? null;
  const firstOrderDate = orders[orders.length - 1]?.created_at ?? null;
  const pointsEarnedTotal = nonCancelled.reduce(
    (s, o) => s + (o.loyalty_points_earned || 0),
    0,
  );

  // Prefere les infos du profile pour les comptes
  const pickedName =
    profile?.full_name ||
    orders[0]?.customer_name ||
    "Inconnu";
  const pickedPhone =
    profile?.phone || orders[0]?.customer_phone || "";
  const pickedEmail = email || orders[0]?.customer_email || null;

  return NextResponse.json({
    id,
    kind, // "user" | "phone" | "email"
    hasAccount: kind === "user",
    name: pickedName,
    phone: pickedPhone,
    email: pickedEmail,
    createdAt: profile?.created_at ?? firstOrderDate,
    stats: {
      orderCount,
      totalSpent,
      pointsEarnedTotal,
      loyaltyBalance: profile?.loyalty_points ?? pointsEarnedTotal,
      lastOrderDate,
      firstOrderDate,
    },
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      orderType: o.order_type,
      status: o.status,
      total: o.total,
      subtotal: o.subtotal,
      deliveryFee: o.delivery_fee,
      loyaltyPointsEarned: o.loyalty_points_earned,
      loyaltyRewardId: o.loyalty_reward_id,
      createdAt: o.created_at,
      notes: o.notes,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      points: t.points,
      description: t.description,
      createdAt: t.created_at,
      orderId: t.order_id,
    })),
  });
}
