import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Flip is_available on a menu_item / menu_item_variant / extra_item.
 * Staff-only. Used by the kitchen "Menu" toggle page to mark an item as
 * "out of stock" in one tap during rush.
 */
const bodySchema = z.object({
  entity: z.enum(["menu_item", "variant", "extra_item"]),
  id: z.string().uuid(),
  isAvailable: z.boolean(),
});

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit("kitchen.menu.toggle", ip, 120, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { entity, id, isAvailable } = parsed.data;

    const admin = createAdminClient();
    const table =
      entity === "menu_item"
        ? "menu_items"
        : entity === "variant"
        ? "menu_item_variants"
        : "extra_items";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from(table)
      .update({ is_available: isAvailable })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/kitchen/menu/toggle]", err);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
