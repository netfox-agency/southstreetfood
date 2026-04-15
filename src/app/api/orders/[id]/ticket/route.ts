import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/orders/[id]/ticket — staff-only
 * Returns full order data (with items + delivery address) for ticket printing.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check
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

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  // Fetch order with items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error } = await (admin as any)
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Fetch delivery address if delivery order
  let deliveryAddress = null;
  if (order.order_type === "delivery") {
    const { data: addr } = await admin
      .from("delivery_addresses")
      .select("*")
      .eq("order_id", id)
      .single();
    deliveryAddress = addr;
  }

  return NextResponse.json({
    order: {
      ...order,
      delivery_address: deliveryAddress,
    },
  });
}
