import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Public "order tracking" endpoint.
 *
 * The storefront /order/track/[id] page polls this to render the progress
 * stepper for an anonymous guest. We intentionally return ONLY the minimal
 * fields needed to render the stepper — no PII, no line items, no totals.
 * Combined with Supabase UUIDv4 ids (≥122 bits of entropy) and RLS locked
 * down on the `orders` table, this closes the guest-side IDOR window.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  // Reject obviously malformed ids before we even hit the DB.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limit = rateLimit("orders.track", ip, 120, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .select(
      "id, order_number, order_type, status, created_at, estimated_ready_at"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Do NOT leak customer_name, phone, totals or items here.
  return NextResponse.json(
    {
      order: {
        id: data.id,
        order_number: data.order_number,
        order_type: data.order_type,
        status: data.status,
        created_at: data.created_at,
        estimated_ready_at: data.estimated_ready_at,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
