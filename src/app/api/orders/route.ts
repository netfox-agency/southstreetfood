import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/queries/orders";
import { priceCartServerSide, PricingError } from "@/lib/queries/pricing";
import { createOrderSchema } from "@/lib/validators";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: 10 orders / minute / IP. Legit customers never need more.
  const ip = getClientIp(request);
  const limit = rateLimit("orders.create", ip, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives, veuillez patienter." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSec),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Server-authoritative pricing — NEVER trust client-sent unitPrice /
    // extrasPrice. We recompute from the DB, which also enforces
    // availability.
    let priced;
    try {
      priced = await priceCartServerSide({
        items: data.items.map((it) => ({
          menuItemId: it.menuItemId,
          variantId: it.variantId ?? null,
          quantity: it.quantity,
          extras: it.extras.map((e) => ({ id: e.id })),
          specialInstructions: it.specialInstructions ?? null,
        })),
        orderType: data.orderType,
      });
    } catch (err) {
      if (err instanceof PricingError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    const result = await createOrder({
      orderType: data.orderType,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || undefined,
      notes: data.notes,
      subtotal: priced.subtotal,
      deliveryFee: priced.deliveryFee,
      total: priced.total,
      items: priced.items.map((it) => ({
        menuItemId: it.menuItemId,
        variantId: it.variantId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        extrasPrice: it.extrasPrice,
        itemName: it.itemName,
        variantName: it.variantName,
        extrasJson: it.extrasJson.map(({ name, price }) => ({ name, price })),
        specialInstructions: it.specialInstructions,
      })),
      deliveryAddress: data.deliveryAddress || null,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = (result as any).order;
    if (!order?.id) {
      return NextResponse.json({ error: "No order created" }, { status: 500 });
    }

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    // Keep internal details out of client-visible responses and log locally
    // with a short marker so we can grep them without shipping stack traces
    // to production logs.
    if (process.env.NODE_ENV !== "production") {
      console.error("[api/orders] creation error:", err);
    } else {
      console.error("[api/orders] creation error");
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
