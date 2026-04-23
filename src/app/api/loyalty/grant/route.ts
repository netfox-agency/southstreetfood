import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/loyalty/grant — admin-only.
 *
 * Crediter (ou debiter si points < 0) manuellement des points fidelite
 * sur un compte. Usage : geste commercial, correction apres incident,
 * points offerts en physique au comptoir sans commande SSF.
 *
 * Body : { userId: string, points: number, reason: string }
 * Points peut etre negatif (debit). On refuse de mettre le solde sous 0.
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
  const { data: me } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!me || (me as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.userId !== "string") {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }
  const userId: string = body.userId;
  const points: number = Number(body.points);
  const reason: string = typeof body.reason === "string" ? body.reason : "";

  if (!Number.isFinite(points) || !Number.isInteger(points) || points === 0) {
    return NextResponse.json(
      { error: "Nombre de points invalide (entier non-nul)" },
      { status: 400 },
    );
  }
  if (Math.abs(points) > 10000) {
    return NextResponse.json(
      { error: "Max +/- 10000 pts par operation" },
      { status: 400 },
    );
  }

  // Utiliser consume si debit, sinon update direct avec refund helper
  let newBalance: number | null = null;
  if (points < 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: res, error } = await (admin as any).rpc(
      "consume_loyalty_points",
      { p_user_id: userId, p_cost: Math.abs(points) },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (res === -1 || res === null) {
      return NextResponse.json(
        { error: "Points insuffisants sur ce compte" },
        { status: 400 },
      );
    }
    newBalance = res as number;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: res, error } = await (admin as any).rpc(
      "refund_loyalty_points",
      { p_user_id: userId, p_cost: points },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    newBalance = (res as number) ?? null;
  }

  // Ledger
  await admin
    .from("loyalty_transactions")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      user_id: userId,
      points,
      description: reason
        ? `[Admin] ${reason}`
        : points > 0
          ? "[Admin] Credit manuel"
          : "[Admin] Debit manuel",
    } as never);

  return NextResponse.json({
    userId,
    pointsApplied: points,
    newBalance: newBalance ?? 0,
  });
}
