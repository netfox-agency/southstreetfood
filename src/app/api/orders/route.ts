import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/queries/orders";
import { createOrderSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
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

    const items = data.items.map((item) => ({
      menuItemId: item.menuItemId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      unitPrice: 0,
      extrasPrice: 0,
      itemName: "Item",
      variantName: null as string | null,
      extrasJson: item.extras as Array<{ name: string; price: number }>,
      specialInstructions: item.specialInstructions || null,
    }));

    const subtotal = data.items.reduce((s, i) => s + i.quantity * 100, 0);
    const deliveryFee = data.orderType === "delivery" ? 350 : 0;
    const total = subtotal + deliveryFee;

    const result = await createOrder({
      orderType: data.orderType,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || undefined,
      notes: data.notes,
      subtotal,
      deliveryFee,
      total,
      items,
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
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
