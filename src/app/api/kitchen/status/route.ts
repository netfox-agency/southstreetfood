import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * GET  /api/kitchen/status  : retourne l'etat actuel du resto (public)
 * POST /api/kitchen/status  : staff peut changer l'etat
 *   { action: 'open' }              → force ouvert
 *   { action: 'closed' }            → force ferme
 *   { action: 'temp_close',         → ferme temporairement, duration_minutes
 *     duration_minutes: 15 }          dans les 240 min max
 *   { action: 'auto' }              → reviens en mode automatique
 */

const postSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open") }),
  z.object({ action: z.literal("closed") }),
  z.object({ action: z.literal("auto") }),
  z.object({
    action: z.literal("temp_close"),
    duration_minutes: z.number().int().min(5).max(240),
  }),
]);

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role;
  if (!role || !["kitchen", "admin"].includes(role)) {
    return { ok: false as const, status: 403 };
  }
  return { ok: true as const, userId: user.id };
}

export async function GET() {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("restaurant_settings")
    .select("manual_status, temp_closed_until, opening_hours")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit("kitchen.status.toggle", ip, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives" },
      { status: 429 },
    );
  }

  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload invalide" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = {};

    switch (parsed.data.action) {
      case "open":
        patch.manual_status = "open";
        patch.temp_closed_until = null;
        break;
      case "closed":
        patch.manual_status = "closed";
        patch.temp_closed_until = null;
        break;
      case "auto":
        patch.manual_status = "auto";
        patch.temp_closed_until = null;
        break;
      case "temp_close": {
        const until = new Date(
          Date.now() + parsed.data.duration_minutes * 60_000,
        );
        patch.manual_status = "temporarily_closed";
        patch.temp_closed_until = until.toISOString();
        break;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("restaurant_settings")
      .update(patch)
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, ...patch });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/kitchen/status]", err);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
