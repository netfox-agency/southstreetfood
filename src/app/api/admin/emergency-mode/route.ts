import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/emergency-mode
 * Body: { active: boolean, message?: string }
 *
 * - Admin peut activer ET desactiver
 * - Kitchen peut SEULEMENT activer (anti-fat-finger : si la cuisine flip
 *   le switch en panique, seul l'admin peut le rallumer apres verif)
 *
 * Auto-disable est planifie a +4h via emergency_mode_auto_disable_at
 * (le cron toutes les 15 min re-passe le toggle a FALSE si depasse).
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
  if (!body || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active requis (boolean)" }, { status: 400 });
  }

  // Kitchen ne peut pas desactiver
  if (role === "kitchen" && body.active === false) {
    return NextResponse.json(
      { error: "Seul un admin peut desactiver le mode urgence" },
      { status: 403 },
    );
  }

  const message =
    typeof body.message === "string" && body.message.trim().length > 0
      ? body.message.trim().slice(0, 500)
      : null;

  const autoDisableAt = body.active
    ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    : null;

  const updatePayload = body.active
    ? {
        emergency_mode_active: true,
        emergency_mode_message: message,
        emergency_mode_activated_at: new Date().toISOString(),
        emergency_mode_activated_by: user.id,
        emergency_mode_auto_disable_at: autoDisableAt,
      }
    : {
        emergency_mode_active: false,
        emergency_mode_message: null,
        emergency_mode_activated_at: null,
        emergency_mode_activated_by: null,
        emergency_mode_auto_disable_at: null,
      };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from("restaurant_settings")
    .update(updatePayload)
    .eq("id", 1);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log (best-effort, on bloque pas si ca rate)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("emergency_mode_logs").insert({
    action: body.active ? "activated" : "deactivated",
    actor_id: user.id,
    actor_role: role,
    message,
  });

  return NextResponse.json({ ok: true, autoDisableAt });
}

/**
 * GET /api/admin/emergency-mode
 * Retourne l'etat courant + les derniers logs (admin/kitchen only).
 */
export async function GET() {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (admin as any)
    .from("restaurant_settings")
    .select(
      "emergency_mode_active, emergency_mode_message, emergency_mode_activated_at, emergency_mode_auto_disable_at",
    )
    .eq("id", 1)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logs } = await (admin as any)
    .from("emergency_mode_logs")
    .select("id, action, actor_role, message, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    active: !!settings?.emergency_mode_active,
    message: settings?.emergency_mode_message ?? null,
    activatedAt: settings?.emergency_mode_activated_at ?? null,
    autoDisableAt: settings?.emergency_mode_auto_disable_at ?? null,
    logs: logs ?? [],
    role,
  });
}
