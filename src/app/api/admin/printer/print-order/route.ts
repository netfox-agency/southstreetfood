import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/printer/print-order
 * Body: { orderId: string }
 *
 * Cree un print_job en status='pending' pour la commande donnee. Le bridge
 * (qui tourne sur le Mac/PC du resto) le picke via Realtime et envoie le
 * ticket a l'imprimante en ~1-2 sec.
 *
 * Idempotent : si y'a deja un job pending/in_flight pour cette commande,
 * on en cree pas un 2eme. Si y'a un job 'printed' deja, on cree quand
 * meme un nouveau (cas reimpression manuelle).
 *
 * Acces : admin OU kitchen.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (!role || !["admin", "kitchen"].includes(role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.orderId || typeof body.orderId !== "string") {
    return NextResponse.json({ error: "orderId requis" }, { status: 400 });
  }

  // Verif que l'order existe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (admin as any)
    .from("orders")
    .select("id")
    .eq("id", body.orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Anti-doublon : check si y'a deja un job actif pour cette order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("print_jobs")
    .select("id, status")
    .eq("order_id", body.orderId)
    .in("status", ["pending", "in_flight"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      jobId: existing.id,
      reused: true,
      message: "Job deja en attente",
    });
  }

  // Cree un nouveau print_job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: job, error } = await (admin as any)
    .from("print_jobs")
    .insert({
      order_id: body.orderId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, jobId: job?.id });
}
