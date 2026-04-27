import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/customers — admin-only.
 *
 * Aggregate les clients depuis les commandes. Dedup primaire par user_id
 * (compte authentifie) sinon par telephone (fallback guest). Pour chaque
 * client on retourne un id stable (user_id si connecte, "phone:+33..."
 * sinon) utilisable pour la fiche detail.
 *
 * Le solde fidelite vient de profiles.loyalty_points pour les comptes
 * (balance live, inclut bonus/depenses) et fallback sur la somme des
 * loyalty_points_earned pour les guests.
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

  let query = admin
    .from("orders")
    .select(
      "user_id, customer_name, customer_phone, customer_email, total, created_at, status, loyalty_points_earned",
    )
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%`,
    );
  }

  type OrderRow = {
    user_id: string | null;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    total: number;
    created_at: string;
    status: string;
    loyalty_points_earned: number | null;
  };

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const orders = (data || []) as unknown as OrderRow[];

  // Dedup : user_id en priorite, sinon phone, sinon email, sinon name.
  type CustomerAgg = {
    id: string; // "user:<uuid>" ou "phone:<digits>" ou "email:<addr>"
    userId: string | null;
    name: string;
    phone: string;
    email: string | null;
    hasAccount: boolean;
    orderCount: number;
    totalSpent: number;
    loyaltyPoints: number;
    lastOrderDate: string;
    firstOrderDate: string;
  };

  const map = new Map<string, CustomerAgg>();
  for (const order of orders) {
    let key: string;
    if (order.user_id) {
      key = `user:${order.user_id}`;
    } else if (order.customer_phone) {
      key = `phone:${order.customer_phone.trim().toLowerCase()}`;
    } else if (order.customer_email) {
      key = `email:${order.customer_email.trim().toLowerCase()}`;
    } else {
      key = `name:${(order.customer_name || "inconnu").trim().toLowerCase()}`;
    }

    // Guests (sans compte) ne peuvent JAMAIS avoir de points utilisables :
    // les anciens loyalty_points_earned sur des orders guest (artefacts
    // legacy ou tests) sont du dead data. On affiche 0 pour eviter le
    // bug visuel "ce guest a 50 pts" alors qu'il n'a aucun compte ou
    // aucun moyen de les depenser.
    const ptsContribution = order.user_id ? (order.loyalty_points_earned || 0) : 0;

    const existing = map.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += order.total || 0;
      existing.loyaltyPoints += ptsContribution;
      if (order.customer_name) existing.name = order.customer_name;
      if (order.customer_email) existing.email = order.customer_email;
      if (order.created_at < existing.firstOrderDate)
        existing.firstOrderDate = order.created_at;
      if (order.created_at > existing.lastOrderDate)
        existing.lastOrderDate = order.created_at;
    } else {
      map.set(key, {
        id: key,
        userId: order.user_id,
        name: order.customer_name || "Inconnu",
        phone: order.customer_phone || "",
        email: order.customer_email || null,
        hasAccount: Boolean(order.user_id),
        orderCount: 1,
        totalSpent: order.total || 0,
        loyaltyPoints: ptsContribution,
        lastOrderDate: order.created_at,
        firstOrderDate: order.created_at,
      });
    }
  }

  // Pour les comptes : on remplace le total de points par le solde LIVE
  // depuis profiles.loyalty_points (inclut les bonus / depenses fidelite).
  const accountIds = Array.from(map.values())
    .filter((c) => c.userId)
    .map((c) => c.userId!) as string[];
  if (accountIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, loyalty_points, full_name, phone")
      .in("id", accountIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (profiles || []) as any[]) {
      const c = map.get(`user:${p.id}`);
      if (c) {
        c.loyaltyPoints = p.loyalty_points ?? c.loyaltyPoints;
        if (p.full_name) c.name = p.full_name;
        if (p.phone && !c.phone) c.phone = p.phone;
      }
    }
  }

  const customers = Array.from(map.values()).sort(
    (a, b) => b.orderCount - a.orderCount,
  );

  return NextResponse.json({
    customers,
    totalCustomers: customers.length,
  });
}
