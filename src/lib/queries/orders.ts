import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/types/database";

export async function createOrder(data: {
  orderType: "collect" | "delivery";
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  scheduledAt?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: Array<{
    menuItemId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice: number;
    extrasPrice: number;
    itemName: string;
    variantName?: string | null;
    extrasJson?: Array<{ name: string; price: number }> | null;
    specialInstructions?: string | null;
  }>;
  deliveryAddress?: {
    street: string;
    city: string;
    postalCode: string;
    lat?: number;
    lng?: number;
    instructions?: string;
  } | null;
}) {
  const supabase = createAdminClient();

  // Insert order
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_type: data.orderType,
      status: "paid" as OrderStatus, // No online payment — order goes directly to kitchen
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail || null,
      notes: data.notes || null,
      scheduled_at: data.scheduledAt || null,
      subtotal: data.subtotal,
      delivery_fee: data.deliveryFee,
      total: data.total,
    } as never)
    .select()
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = orderData as any;

  if (orderError || !order) {
    return { error: orderError?.message || "Failed to create order", order: null };
  }

  // Insert order items
  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    variant_id: item.variantId || null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    extras_price: item.extrasPrice,
    item_name: item.itemName,
    variant_name: item.variantName || null,
    extras_json: item.extrasJson || null,
    special_instructions: item.specialInstructions || null,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems as never);

  if (itemsError) {
    return { error: itemsError.message, order: null };
  }

  // Insert delivery address if delivery
  if (data.orderType === "delivery" && data.deliveryAddress) {
    const { error: addrError } = await supabase
      .from("delivery_addresses")
      .insert({
        order_id: order.id,
        street: data.deliveryAddress.street,
        city: data.deliveryAddress.city,
        postal_code: data.deliveryAddress.postalCode,
        lat: data.deliveryAddress.lat || null,
        lng: data.deliveryAddress.lng || null,
        delivery_instructions: data.deliveryAddress.instructions || null,
      } as never);

    if (addrError) {
      return { error: addrError.message, order: null };
    }
  }

  return { error: null, order };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra?: { stripePaymentIntentId?: string; estimatedReadyAt?: string }
) {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "paid") {
    updateData.payment_status = "succeeded";
  }

  if (extra?.stripePaymentIntentId) {
    updateData.stripe_payment_intent_id = extra.stripePaymentIntentId;
  }

  if (extra?.estimatedReadyAt) {
    updateData.estimated_ready_at = extra.estimatedReadyAt;
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData as never)
    .eq("id", orderId);

  return { error };
}

export async function getOrderById(orderId: string) {
  // Use admin client to bypass RLS
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = data as any;

  if (order.order_type === "delivery") {
    const { data: addr } = await supabase
      .from("delivery_addresses")
      .select("*")
      .eq("order_id", orderId)
      .single();

    return { ...order, delivery_address: addr };
  }

  return { ...order, delivery_address: null };
}
