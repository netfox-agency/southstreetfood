import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/queries/orders";
import { priceCartServerSide, PricingError } from "@/lib/queries/pricing";
import { createOrderSchema } from "@/lib/validators";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/orders — staff-only. Returns today's orders for the admin dashboard.
 * Query params: ?date=YYYY-MM-DD (defaults to today)
 */
export async function GET(request: NextRequest) {
  // Auth check: must be admin or kitchen staff
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "kitchen"].includes((profile as { role: string }).role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  // Parse date filter
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const today = new Date();
  const targetDate =
    dateParam === "today" || !dateParam
      ? today.toISOString().split("T")[0]
      : dateParam;

  const startOfDay = `${targetDate}T00:00:00.000Z`;
  const endOfDay = `${targetDate}T23:59:59.999Z`;

  const { data: orders, error } = await admin
    .from("orders")
    .select("id, order_number, customer_name, total, status, order_type, created_at")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: orders || [] });
}

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

    // Check resto ouvert : on bloque les commandes hors horaires ou si
    // l'admin a mis "fermé" manuellement. Sinon un client peut commander
    // a 14h alors que le service est de 19h-4h, ou pendant une fermeture
    // temporaire (staff deborde). Le message retourne explique quand ca
    // reouvre.
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const { computeCurrentStatus } = await import(
        "@/lib/queries/restaurant-status"
      );
      const admin = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: settings } = await (admin as any)
        .from("restaurant_settings")
        .select("manual_status, temp_closed_until, opening_hours")
        .eq("id", 1)
        .single();
      if (settings) {
        const status = computeCurrentStatus(settings);
        if (!status.isOpen) {
          return NextResponse.json(
            { error: status.message, reason: status.reason, reopensAt: status.reopensAt },
            { status: 423 }, // 423 Locked : resource temporarily unavailable
          );
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[api/orders] status check failed:", err);
      }
      // En cas d'erreur inattendue dans le check status, on laisse passer
      // pour ne pas bloquer les commandes si le check a un bug. L'admin
      // preferera traiter des commandes en trop que de tout bloquer.
    }

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
        deliveryCity: data.deliveryAddress?.city ?? null,
      });
    } catch (err) {
      if (err instanceof PricingError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    // Fidelite : si une recompense est selectionnee, on valide cote serveur
    // que le user est connecte et qu'il a le solde requis. On prepare une ou
    // plusieurs lignes gratuites (price=0) qui seront ajoutees au panier
    // avant creation. free_item = 1 ligne, combo_menu = N lignes (bundle).
    type RewardLine = {
      menuItemId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: number;
      extrasPrice: number;
      itemName: string;
      variantName: string | null;
      extrasJson: { name: string; price: number }[];
      specialInstructions: string | null;
    };
    let loyaltyRewardLines: RewardLine[] = [];
    let loyaltyRewardId: string | null = null;
    let loyaltyUserId: string | null = null;
    let loyaltyPointsCost = 0;

    if (data.loyaltyRewardId) {
      const authSupabase = await createClient();
      const {
        data: { user: authUser },
      } = await authSupabase.auth.getUser();
      if (!authUser) {
        return NextResponse.json(
          { error: "Connecte-toi pour utiliser une recompense" },
          { status: 401 },
        );
      }
      const admin = createAdminClient();
      const [{ data: rewardRow }, { data: profileRow }] = await Promise.all([
        admin
          .from("loyalty_rewards")
          .select(
            "id, name, points_cost, reward_type, reward_menu_item_id, bundle_menu_item_ids, is_active, menu_items:reward_menu_item_id(id, name, base_price)",
          )
          .eq("id", data.loyaltyRewardId)
          .single(),
        admin
          .from("profiles")
          .select("loyalty_points")
          .eq("id", authUser.id)
          .single(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reward = rewardRow as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentBalance = (profileRow as any)?.loyalty_points ?? 0;

      if (!reward || reward.is_active === false) {
        return NextResponse.json(
          { error: "Recompense indisponible" },
          { status: 400 },
        );
      }
      if (currentBalance < reward.points_cost) {
        return NextResponse.json(
          { error: "Points insuffisants pour cette recompense" },
          { status: 400 },
        );
      }

      loyaltyRewardId = reward.id;
      loyaltyUserId = authUser.id;
      loyaltyPointsCost = reward.points_cost;

      if (reward.reward_type === "free_item" && reward.menu_items) {
        loyaltyRewardLines = [
          {
            menuItemId: reward.menu_items.id,
            variantId: null,
            quantity: 1,
            unitPrice: 0,
            extrasPrice: 0,
            itemName: `${reward.menu_items.name} (recompense fidelite)`,
            variantName: null,
            extrasJson: [],
            specialInstructions: `Offert · -${reward.points_cost} pts`,
          },
        ];
      } else if (
        reward.reward_type === "combo_menu" &&
        Array.isArray(reward.bundle_menu_item_ids) &&
        reward.bundle_menu_item_ids.length > 0
      ) {
        // Fetch les menu_items du combo pour remplir les noms/ids
        const admin2 = createAdminClient();
        const { data: bundleItems } = await admin2
          .from("menu_items")
          .select("id, name")
          .in("id", reward.bundle_menu_item_ids);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (bundleItems ?? []) as any[];
        if (items.length === 0) {
          return NextResponse.json(
            { error: "Combo fidelite invalide" },
            { status: 400 },
          );
        }
        loyaltyRewardLines = items.map((mi) => ({
          menuItemId: mi.id,
          variantId: null,
          quantity: 1,
          unitPrice: 0,
          extrasPrice: 0,
          itemName: `${mi.name} (menu fidelite)`,
          variantName: null,
          extrasJson: [],
          specialInstructions: `Offert · Menu ${reward.points_cost} pts`,
        }));
      } else {
        return NextResponse.json(
          { error: "Type de recompense non supporte" },
          { status: 400 },
        );
      }
    }

    const finalItems = [
      ...priced.items.map((it) => ({
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
      ...loyaltyRewardLines,
    ];

    const result = await createOrder({
      orderType: data.orderType,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || undefined,
      notes: data.notes,
      subtotal: priced.subtotal,
      deliveryFee: priced.deliveryFee,
      total: priced.total,
      items: finalItems,
      deliveryAddress: data.deliveryAddress || null,
      userId: loyaltyUserId ?? undefined,
      loyaltyRewardId: loyaltyRewardId ?? undefined,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = (result as any).order;
    if (!order?.id) {
      return NextResponse.json({ error: "No order created" }, { status: 500 });
    }

    // Fidelite : debit des points en atomique (apres creation order pour
    // avoir order_id). Si ca echoue on ne re-crediite pas la commande (la
    // prep est lancee, on preferera gerer manuellement que bloquer).
    if (loyaltyUserId && loyaltyRewardId && loyaltyPointsCost > 0) {
      const admin = createAdminClient();
      const { data: profileRow } = await admin
        .from("profiles")
        .select("loyalty_points")
        .eq("id", loyaltyUserId)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const balance = (profileRow as any)?.loyalty_points ?? 0;
      await admin
        .from("profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ loyalty_points: Math.max(0, balance - loyaltyPointsCost) } as never)
        .eq("id", loyaltyUserId);
      await admin
        .from("loyalty_transactions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          user_id: loyaltyUserId,
          order_id: order.id,
          points: -loyaltyPointsCost,
          description: "Recompense utilisee",
        } as never);
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
