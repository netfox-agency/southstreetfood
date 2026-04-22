import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/loyalty/balance — connected user only.
 *
 * Retourne le solde de points depuis profiles.loyalty_points (cache rapide)
 * ainsi que les 20 dernieres transactions pour l'historique UI.
 *
 * Connecte = obligatoire. Les points ne se gagnent et se depensent que via
 * un compte. Un guest voit le message "Cree un compte pour gagner des points".
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecte" }, { status: 401 });
  }

  const admin = createAdminClient();

  const [profileRes, txRes] = await Promise.all([
    admin
      .from("profiles")
      .select("loyalty_points, full_name")
      .eq("id", user.id)
      .single(),
    admin
      .from("loyalty_transactions")
      .select("id, points, description, created_at, order_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (profileRes.error) {
    return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRes.data as any;

  return NextResponse.json({
    points: profile?.loyalty_points ?? 0,
    fullName: profile?.full_name ?? null,
    transactions: txRes.data ?? [],
  });
}
