import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public subset of restaurant_settings used by the storefront cart / checkout
 * (delivery fee, minimum order, toggles). We intentionally strip everything
 * sensitive (no phone, no email, no internal toggles) and cache the response
 * on the edge for 30s — restaurant settings change rarely and 500 cmd/soir
 * would otherwise hit the DB 500+ times.
 */
export async function GET() {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("restaurant_settings")
    .select(
      "base_delivery_fee, min_order_delivery, delivery_enabled, collect_enabled, estimated_prep_minutes"
    )
    .limit(1)
    .maybeSingle();

  // Safe defaults in case the row doesn't exist yet
  const payload = {
    baseDeliveryFee:
      data && typeof data.base_delivery_fee === "number"
        ? data.base_delivery_fee
        : 350,
    minOrderDelivery:
      data && typeof data.min_order_delivery === "number"
        ? data.min_order_delivery
        : 0,
    deliveryEnabled:
      data && typeof data.delivery_enabled === "boolean"
        ? data.delivery_enabled
        : true,
    collectEnabled:
      data && typeof data.collect_enabled === "boolean"
        ? data.collect_enabled
        : true,
    estimatedPrepMinutes:
      data && typeof data.estimated_prep_minutes === "number"
        ? data.estimated_prep_minutes
        : 20,
  };

  return NextResponse.json(payload, {
    headers: {
      // 30s fresh on the edge, 5min stale-while-revalidate. Cuts the DB load
      // at peak without delaying price changes too much.
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
    },
  });
}
