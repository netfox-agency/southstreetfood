import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * CRUD ingredients (admin seulement pour les ecritures, staff pour lecture).
 *
 *  GET   /api/admin/ingredients        : liste tous les ingredients
 *  POST  /api/admin/ingredients        : cree un ingredient
 *                                        { name, display_order?, menuItemIds?, extraIds? }
 *
 *  Endpoints /[id] dans route.ts frere pour UPDATE/DELETE.
 */

const createSchema = z.object({
  name: z.string().min(1).max(80),
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

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit("admin.ingredients.get", ip, 60, 60_000);
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

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ingredients, error } = await (admin as any)
    .from("ingredients")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch les links menu_item et extra
  const [{ data: miLinks }, { data: exLinks }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from("menu_item_ingredients").select("*"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from("extra_item_ingredients").select("*"),
  ]);

  // Attache les IDs lies a chaque ingredient
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = (ingredients || []).map((ing: any) => ({
    ...ing,
    menu_item_ids:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (miLinks || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((l: any) => l.ingredient_id === ing.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((l: any) => l.menu_item_id),
    extra_item_ids:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (exLinks || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((l: any) => l.ingredient_id === ing.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((l: any) => l.extra_id),
  }));

  return NextResponse.json({ ingredients: enriched });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit("admin.ingredients.post", ip, 30, 60_000);
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

  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload invalide" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Insert ingredient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error: createErr } = await (admin as any)
      .from("ingredients")
      .insert({
        name: parsed.data.name.trim(),
        display_order: parsed.data.display_order ?? 0,
      })
      .select("*")
      .single();

    if (createErr) {
      if (createErr.code === "23505") {
        return NextResponse.json(
          { error: `Un ingredient "${parsed.data.name}" existe deja` },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }

    // Insert links menu_item si fournis
    if (parsed.data.menuItemIds && parsed.data.menuItemIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: linkErr } = await (admin as any)
        .from("menu_item_ingredients")
        .insert(
          parsed.data.menuItemIds.map((menu_item_id) => ({
            menu_item_id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ingredient_id: (created as any).id,
          })),
        );
      if (linkErr) {
        // Rollback ingredient si les links plantent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from("ingredients")
          .delete()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq("id", (created as any).id);
        return NextResponse.json(
          { error: "Erreur liaison menu items" },
          { status: 500 },
        );
      }
    }

    if (parsed.data.extraIds && parsed.data.extraIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: linkErr } = await (admin as any)
        .from("extra_item_ingredients")
        .insert(
          parsed.data.extraIds.map((extra_id) => ({
            extra_id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ingredient_id: (created as any).id,
          })),
        );
      if (linkErr) {
        return NextResponse.json(
          { error: "Erreur liaison extras" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ ingredient: created }, { status: 201 });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/admin/ingredients POST]", err);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
