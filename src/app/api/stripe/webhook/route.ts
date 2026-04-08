import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { updateOrderStatus } from "@/lib/queries/orders";
import { minutesFromNow } from "@/lib/utils";

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

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      // Update order to paid — this triggers Supabase Realtime -> KDS
      await updateOrderStatus(orderId, "paid", {
        stripePaymentIntentId: paymentIntent.id,
        estimatedReadyAt: minutesFromNow(20).toISOString(),
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      // Mark payment as failed
      await updateOrderStatus(orderId, "cancelled");
    }
  }

  return NextResponse.json({ received: true });
}
