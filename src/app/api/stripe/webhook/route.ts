import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { updateOrderStatus } from "@/lib/queries/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { minutesFromNow } from "@/lib/utils";

// Next.js 16 App Router route — we need the raw body to verify Stripe's
// signature, so we read with request.text() (NOT request.json()).
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotence — Stripe retries on any 5xx or network hiccup. Without this
  // check, a retry can flip an already-paid order through state transitions
  // that the KDS would treat as a fresh ticket.
  const supabase = createAdminClient();

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from("orders")
        .select("status, stripe_payment_intent_id")
        .eq("id", orderId)
        .single();

      const alreadyProcessed =
        existing?.stripe_payment_intent_id === paymentIntent.id &&
        ["paid", "preparing", "ready", "picked_up", "delivered"].includes(
          existing.status
        );

      if (!alreadyProcessed) {
        await updateOrderStatus(orderId, "paid", {
          stripePaymentIntentId: paymentIntent.id,
          estimatedReadyAt: minutesFromNow(20).toISOString(),
        });
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (existing?.status !== "cancelled") {
        await updateOrderStatus(orderId, "cancelled");
      }
    }
  }

  return NextResponse.json({ received: true });
}
