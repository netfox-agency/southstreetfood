import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { computeNextResetAt } from "@/types/stock";

/**
 * Toggle availability_status on menu_item / menu_item_variant / extra_item /
 * ingredient. Staff-only. Used by the kitchen "Menu" page.
 *
 * 3 statuts possibles :
 *   - in_stock              : dispo
 *   - unavailable_today     : indispo jusqu'au prochain reset auto (05:00 Paris)
 *   - unavailable_indefinite: indispo jusqu'a remise en stock manuelle
 *
 * Back-compat : si le body contient `isAvailable` (boolean, ancien format),
 * on le traduit : true → in_stock, false → unavailable_indefinite.
 */

const newFormatSchema = z.object({
  entity: z.enum(["menu_item", "variant", "extra_item", "ingredient"]),
  id: z.string().uuid(),
  status: z.enum([
    "in_stock",
    "unavailable_today",
    "unavailable_indefinite",
  ]),
  // Borne dure : unavailable_until doit etre dans le futur mais pas au-dela
  // de 30 jours. Empeche un payload buggy (ou malicieux) de bloquer un item
  // pour 10 ans en passant une date lointaine.
  unavailable_until: z
    .string()
    .datetime()
    .refine(
      (d) => {
        const t = new Date(d).getTime();
        const now = Date.now();
        return t > now - 60_000 && t < now + 30 * 24 * 60 * 60 * 1000;
      },
      { message: "unavailable_until doit etre dans les 30 prochains jours" },
    )
    .optional()
    .nullable(),
});

const legacyFormatSchema = z.object({
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

function entityToTable(entity: string): string {
  switch (entity) {
    case "menu_item":
      return "menu_items";
    case "variant":
      return "menu_item_variants";
    case "extra_item":
      return "extra_items";
    case "ingredient":
      return "ingredients";
    default:
      throw new Error(`Unknown entity: ${entity}`);
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit("kitchen.menu.toggle", ip, 120, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  try {
    const raw = await request.json();

    // Essaye le nouveau format d'abord, fallback sur le legacy (boolean)
    const newFormat = newFormatSchema.safeParse(raw);
    const legacyFormat = newFormat.success
      ? null
      : legacyFormatSchema.safeParse(raw);

    if (!newFormat.success && !legacyFormat?.success) {
      return NextResponse.json(
        {
          error:
            newFormat.error.issues[0]?.message ?? "Payload invalide",
        },
        { status: 400 },
      );
    }

    let entity: "menu_item" | "variant" | "extra_item" | "ingredient";
    let id: string;
    let status: "in_stock" | "unavailable_today" | "unavailable_indefinite";
    let unavailable_until: string | null;

    if (newFormat.success) {
      ({ entity, id, status } = newFormat.data);
      unavailable_until =
        newFormat.data.unavailable_until !== undefined
          ? newFormat.data.unavailable_until
          : status === "unavailable_today"
            ? computeNextResetAt()
            : null;
    } else if (legacyFormat?.success) {
      // Legacy path : bool → status
      entity = legacyFormat.data.entity;
      id = legacyFormat.data.id;
      status = legacyFormat.data.isAvailable
        ? "in_stock"
        : "unavailable_indefinite";
      unavailable_until = null;
    } else {
      // unreachable grace a la garde ci-dessus, mais TS ne le sait pas
      return NextResponse.json(
        { error: "Payload invalide" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const table = entityToTable(entity);

    // Construit la row d'update : availability_status + unavailable_until,
    // et sur les tables avec is_available on met a jour pour back-compat
    // (queries storefront lisent encore is_available directement par endroits).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = {
      availability_status: status,
      unavailable_until,
    };
    if (entity !== "ingredient") {
      patch.is_available = status === "in_stock";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from(table)
      .update(patch)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status, unavailable_until });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/kitchen/menu/toggle]", err);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
