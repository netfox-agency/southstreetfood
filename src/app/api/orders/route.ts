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

    // AUTH : si un client (role=customer) est connecte, on lie la commande
    // a son compte → l'auto-award des points marche.
    //
    // EN REVANCHE : staff (admin/kitchen) qui place une commande de test
    // depuis le meme browser ne doit PAS etre auto-lie. Sinon, le staff
    // qui teste le flow gagne des points sur son propre compte (bug
    // remonte par le client : "j'ai pas de compte mais j'ai des points").
    // Les staff orders restent user_id=null et le trigger ne credite pas.
    let authenticatedUserId: string | null = null;
    try {
      const authSupabase = await createClient();
      const {
        data: { user: authUser },
      } = await authSupabase.auth.getUser();
      if (authUser) {
        // Verifier le role : SEUL un customer voit son order linke
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .single();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role = (profile as any)?.role;
        if (role === "customer") {
          authenticatedUserId = authUser.id;
        }
        // Staff (admin/kitchen) → on ne lie pas, order reste guest
      }
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
        .select("manual_status, temp_closed_until, opening_hours, emergency_mode_active, emergency_mode_message")
        .eq("id", 1)
        .single();
      if (settings) {
        // Kill-switch mode urgence : prioritaire sur tout le reste. Si admin
        // a coupe les commandes online, on refuse meme si le client a slip
        // past le client-side gate (cache stale, race condition...).
        if (settings.emergency_mode_active) {
          return NextResponse.json(
            {
              error:
                settings.emergency_mode_message?.trim() ||
                "Commande au telephone uniquement aujourd'hui. Appelez-nous pour passer commande.",
              reason: "emergency_mode",
            },
            { status: 423 },
          );
        }
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

    // Loyalty v3 : tier-based system avec selections par slot.
    // Le serveur fait TOUT via la PG function consume_loyalty_v3 qui valide
    // atomiquement : balance + categorie + exclusions + items dispos +
    // debite + log la transaction. Le client n'a aucune confiance accordee.
    if (data.loyaltySelection) {
      if (!authenticatedUserId) {
        return NextResponse.json(
          { error: "Connecte-toi pour utiliser une recompense" },
          { status: 401 },
        );
      }
      const admin = createAdminClient();
      const sel = data.loyaltySelection;

      // Appel atomique : valide + debite + log
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: consumeResult, error: consumeError } = await (admin as any).rpc(
        "consume_loyalty_v3",
        {
          p_user_id: authenticatedUserId,
          p_reward_id: sel.rewardId,
          p_main_id: sel.mainId ?? null,
          p_fries_id: sel.friesId ?? null,
          p_drink_id: sel.drinkId ?? null,
          p_dessert_id: sel.dessertId ?? null,
        },
      );

      if (consumeError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[api/orders] consume_loyalty_v3 RPC error:", consumeError);
        }
        return NextResponse.json(
          { error: "Erreur lors de l'utilisation des points" },
          { status: 500 },
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cr = consumeResult as any;
      if (!cr || cr.success !== true) {
        const errCode = cr?.error || "unknown";
        const msgMap: Record<string, string> = {
          profile_not_found: "Compte introuvable",
          reward_not_found_or_inactive: "Palier indisponible",
          insufficient_points: "Points insuffisants",
          main_required: "Sandwich requis",
          main_not_available: "Sandwich indisponible",
          main_category_not_eligible: "Sandwich non eligible a ce palier",
          main_excluded: "Cet item est exclu de ce palier",
          fries_required: "Frites requises",
          fries_invalid: "Frites invalides",
          drink_required: "Boisson requise",
          drink_invalid: "Boisson invalide",
          dessert_required: "Dessert requis",
          dessert_invalid: "Dessert invalide",
        };
        return NextResponse.json(
          { error: msgMap[errCode] || "Recompense invalide" },
          { status: 400 },
        );
      }

      // La PG function nous renvoie la liste des menu_item_ids a mettre
      // a 0€ dans la commande. On va chercher leurs noms pour des lignes
      // proprement nommees dans le ticket cuisine.
      const freeItemIds: string[] = Array.isArray(cr.free_item_ids)
        ? cr.free_item_ids
        : [];
      const pointsSpent: number = cr.points_cost || 0;

      if (freeItemIds.length > 0) {
        const { data: itemsRows } = await admin
          .from("menu_items")
          .select("id, name")
          .in("id", freeItemIds);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (itemsRows ?? []) as any[];

        loyaltyRewardLines = rows.map((mi) => ({
          menuItemId: mi.id,
          variantId: null,
          quantity: 1,
          unitPrice: 0,
          extrasPrice: 0,
          itemName: `${mi.name} (fidelite)`,
          variantName: null,
          extrasJson: [],
          specialInstructions: `Offert · ${pointsSpent} pts`,
        }));
      }

      loyaltyRewardId = sel.rewardId;
      loyaltyUserId = authenticatedUserId;
      loyaltyPointsCost = pointsSpent;
      loyaltyUserIdOuter = authenticatedUserId;
      loyaltyPointsCostOuter = pointsSpent;
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

    // Fidelite v3 : la PG function consume_loyalty_v3 a deja log la transaction
    // avec points + description. On link juste l'order_id apres coup pour le
    // tracking. (Best effort, pas critique si echec.)
    if (loyaltyUserId && loyaltyRewardId && loyaltyPointsCost > 0) {
      const admin = createAdminClient();
      // Update la derniere transaction redemption sans order_id de ce user
      const { data: lastTxRaw } = await admin
        .from("loyalty_transactions")
        .select("id")
        .eq("user_id", loyaltyUserId)
        .eq("points", -loyaltyPointsCost)
        .is("order_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastTx = lastTxRaw as any;
      if (lastTx?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from("loyalty_transactions")
          .update({ order_id: order.id })
          .eq("id", lastTx.id);
      }
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
