import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  // SECURITY: Stripe payments are not yet active (pay-on-site model).
  // This endpoint is disabled until online payments are implemented with
  // proper session-based auth. Without this guard, anyone with a valid
  // orderId could create PaymentIntents and read order PII.
  if (!process.env.STRIPE_PAYMENTS_ENABLED) {
    return NextResponse.json(
      { error: "Online payments are not enabled" },
      { status: 503 }
    );
  }

  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch order - use any to avoid complex type narrowing with Supabase
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = data as any;

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Order already processed" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id, orderNumber: String(order.order_number) },
    });

    await supabase
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
      } as never)
      .eq("id", orderId);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
