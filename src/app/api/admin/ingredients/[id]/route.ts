import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 *  PATCH /api/admin/ingredients/[id]  : update nom + display_order + links
 *  DELETE /api/admin/ingredients/[id]  : delete ingredient (cascade junctions)
 */

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  display_order: z.number().int().min(0).max(9999).optional(),
  menuItemIds: z.array(z.string().uuid()).optional(),
  extraIds: z.array(z.string().uuid()).optional(),
});

async function requireAdmin() {
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
  if (!role || role !== "admin") {
    return { ok: false as const, status: 403 };
  }
  return { ok: true as const, userId: user.id };
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request);
  const limit = rateLimit("admin.ingredients.patch", ip, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives" },
      { status: 429 },
    );
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await ctx.params;

  try {
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload invalide" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {};
    if (parsed.data.name !== undefined) {
      updatePayload.name = parsed.data.name.trim();
    }
    if (parsed.data.display_order !== undefined) {
      updatePayload.display_order = parsed.data.display_order;
    }

    if (Object.keys(updatePayload).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin as any)
        .from("ingredients")
        .update(updatePayload)
        .eq("id", id);
      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "Ce nom est deja pris" },
            { status: 409 },
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Replace junction links if provided (sync full list semantics)
    if (parsed.data.menuItemIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("menu_item_ingredients")
        .delete()
        .eq("ingredient_id", id);
      if (parsed.data.menuItemIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from("menu_item_ingredients").insert(
          parsed.data.menuItemIds.map((menu_item_id) => ({
            menu_item_id,
            ingredient_id: id,
          })),
        );
      }
    }

    if (parsed.data.extraIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("extra_item_ingredients")
        .delete()
        .eq("ingredient_id", id);
      if (parsed.data.extraIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from("extra_item_ingredients").insert(
          parsed.data.extraIds.map((extra_id) => ({
            extra_id,
            ingredient_id: id,
          })),
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/admin/ingredients PATCH]", err);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request);
  const limit = rateLimit("admin.ingredients.delete", ip, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives" },
      { status: 429 },
    );
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("ingredients")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
