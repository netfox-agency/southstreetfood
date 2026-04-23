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

  // Hoiste hors du try : permet au catch de rembourser les points si
  // une erreur inattendue survient apres le debit.
  let loyaltyUserIdOuter: string | null = null;
  let loyaltyPointsCostOuter = 0;

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

    // AUTH : si un user est connecte, on lie TOUJOURS la commande a son
    // compte (user_id). Sans ca, meme un client connecte qui commande sans
    // recompense fidelite aurait user_id=null et ne gagnerait pas de points
    // a la livraison (le guard guest de /api/loyalty/award refuse si
    // user_id est null). Bug classique : "je me suis cree un compte mais
    // j'ai 0 points apres ma commande".
    let authenticatedUserId: string | null = null;
    try {
      const authSupabase = await createClient();
      const {
        data: { user: authUser },
      } = await authSupabase.auth.getUser();
      if (authUser) authenticatedUserId = authUser.id;
    } catch {
      // Anonymous order, pas grave
    }

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
      if (!authenticatedUserId) {
        return NextResponse.json(
          { error: "Connecte-toi pour utiliser une recompense" },
          { status: 401 },
        );
      }
      const authUser = { id: authenticatedUserId };
      const admin = createAdminClient();
      const { data: rewardRow } = await admin
        .from("loyalty_rewards")
        .select(
          "id, name, points_cost, reward_type, reward_menu_item_id, bundle_menu_item_ids, is_active, menu_items:reward_menu_item_id(id, name, base_price)",
        )
        .eq("id", data.loyaltyRewardId)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reward = rewardRow as any;

      if (!reward || reward.is_active === false) {
        return NextResponse.json(
          { error: "Recompense indisponible" },
          { status: 400 },
        );
      }

      // Construction des lignes a AVANT de debiter (si le type est invalide,
      // on ne touche pas au solde).
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
        const { data: bundleItems } = await admin
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

      // DEBIT ATOMIQUE : UPDATE ... WHERE balance >= cost. Deux commandes
      // en parallele ne peuvent pas depasser le solde. Si ca retourne -1
      // le user n'a pas assez OU une autre commande vient de debiter.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: consumeResult, error: consumeError } = await (admin as any).rpc(
        "consume_loyalty_points",
        { p_user_id: authUser.id, p_cost: reward.points_cost },
      );
      if (consumeError) {
        return NextResponse.json(
          { error: "Erreur lors de l'utilisation des points" },
          { status: 500 },
        );
      }
      if (consumeResult === -1 || consumeResult === null) {
        return NextResponse.json(
          { error: "Points insuffisants pour cette recompense" },
          { status: 400 },
        );
      }

      loyaltyRewardId = reward.id;
      loyaltyUserId = authUser.id;
      loyaltyPointsCost = reward.points_cost;
      loyaltyUserIdOuter = authUser.id;
      loyaltyPointsCostOuter = reward.points_cost;
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
      // On prefere loyaltyUserId (set si reward pris) mais sinon on retombe
      // sur l'auth user. Les guests gardent null.
      userId: loyaltyUserId ?? authenticatedUserId ?? undefined,
      loyaltyRewardId: loyaltyRewardId ?? undefined,
    });

    // Helper: si le order a fail et qu'on avait debite des points, on les
    // rend au user pour eviter une perte silencieuse. Best effort : on log
    // une erreur si le refund lui-meme echoue (admin pourra voir en base).
    const refundIfNeeded = async () => {
      if (!loyaltyUserId || loyaltyPointsCost <= 0) return;
      const admin = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).rpc("refund_loyalty_points", {
        p_user_id: loyaltyUserId,
        p_cost: loyaltyPointsCost,
      });
    };

    if (result.error) {
      await refundIfNeeded();
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = (result as any).order;
    if (!order?.id) {
      await refundIfNeeded();
      return NextResponse.json({ error: "No order created" }, { status: 500 });
    }

    // Fidelite : order cree avec succes, on log la transaction ledger
    // (points deja debites en amont via consume_loyalty_points). Puis on
    // flush les flags outer pour que le catch final ne rembourse pas.
    if (loyaltyUserId && loyaltyRewardId && loyaltyPointsCost > 0) {
      const admin = createAdminClient();
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
    // Succes : plus besoin de refund en cas d'erreur future
    loyaltyUserIdOuter = null;
    loyaltyPointsCostOuter = 0;

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    // Refund best-effort : si des points ont ete consommes mais qu'on est
    // tombe dans le catch avant le succes, on les rend au user.
    if (loyaltyUserIdOuter && loyaltyPointsCostOuter > 0) {
      try {
        const admin = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).rpc("refund_loyalty_points", {
          p_user_id: loyaltyUserIdOuter,
          p_cost: loyaltyPointsCostOuter,
        });
      } catch {
        // On ne peut rien de plus : admin verra l'anomalie en base
        console.error("[api/orders] refund after crash FAILED");
      }
    }
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
