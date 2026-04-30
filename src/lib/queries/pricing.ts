import { createAdminClient } from "@/lib/supabase/admin";
import { getDeliveryFeeForCity, getMinOrderForCity } from "@/lib/constants";

/**
 * Server-authoritative pricing for an incoming cart.
 *
 * NEVER trust prices (unitPrice, extrasPrice) sent by the client. This
 * function takes the raw items as the user selected them (by menu_item_id,
 * optional variant_id, and extra_items IDs) and returns the canonical
 * per-item pricing recomputed from the database.
 *
 * Throws a PricingError if:
 *   - a menu item / variant / extra does not exist
 *   - any referenced row is marked unavailable
 *   - the cart is empty
 */
export class PricingError extends Error {
  constructor(
    message: string,
    readonly code:
      | "ITEM_NOT_FOUND"
      | "ITEM_UNAVAILABLE"
      | "VARIANT_NOT_FOUND"
      | "VARIANT_UNAVAILABLE"
      | "EXTRA_NOT_FOUND"
      | "EXTRA_UNAVAILABLE"
      | "EMPTY_CART"
      | "DELIVERY_ZONE_INVALID"
  ) {
    super(message);
    this.name = "PricingError";
  }
}

export type PricedCartItem = {
  menuItemId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number; // cents, DB-authoritative
  extrasPrice: number; // cents, DB-authoritative (sum of extras)
  itemName: string;
  variantName: string | null;
  extrasJson: Array<{ id: string; name: string; price: number }>;
  specialInstructions: string | null;
};

export type PricedCart = {
  items: PricedCartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

type InputItem = {
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
  extras: Array<{ id: string }>;
  specialInstructions?: string | null;
};

const DELIVERY_FEE_FALLBACK_CENTS = 350;

export async function priceCartServerSide(
  input: {
    items: InputItem[];
    orderType: "collect" | "delivery" | "dine_in";
    deliveryCity?: string | null;
  }
): Promise<PricedCart> {
  if (!input.items.length) {
    throw new PricingError("Cart is empty", "EMPTY_CART");
  }

  const supabase = createAdminClient();

  // Collect all distinct ids we need to look up
  const menuItemIds = Array.from(new Set(input.items.map((i) => i.menuItemId)));
  const variantIds = Array.from(
    new Set(
      input.items
        .map((i) => i.variantId)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    )
  );
  const extraIds = Array.from(
    new Set(input.items.flatMap((i) => i.extras.map((e) => e.id)))
  );

  // Parallel fetch — one round-trip per table instead of N+1.
  // We also pull restaurant_settings so the delivery fee is
  // DB-authoritative (admin can tweak it without a redeploy).
  // IMPORTANT : on lit via les VIEWs pour avoir effective_available qui
  // prend en compte la cascade ingredients. Si les VIEWs n'existent pas
  // encore (migrations 006-008 pas appliquees), fallback sur les tables
  // brutes et synthese de effective_available depuis is_available.
  //
  // Helper inline car la fonction a besoin d'etre locale au pricing flow
  // (pas de partage de state entre les 3 queries).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isMissingRel = (err: any) =>
    err?.code === "42P01" ||
    err?.code === "PGRST205" ||
    /not find|does not exist/i.test(err?.message || "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchMenuItems = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const first = await (supabase as any)
      .from("menu_items_with_availability")
      .select("id, name, base_price, effective_available, blocking_ingredient")
      .in("id", menuItemIds);
    if (!first.error) return first;
    if (!isMissingRel(first.error)) return first;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fb = await (supabase as any)
      .from("menu_items")
      .select("id, name, base_price, is_available")
      .in("id", menuItemIds);
    if (fb.error) return fb;
    return {
      ...fb,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (fb.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        base_price: r.base_price,
        effective_available: r.is_available !== false,
        blocking_ingredient: null,
      })),
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchExtras = async () => {
    if (extraIds.length === 0) return { data: [], error: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const first = await (supabase as any)
      .from("extra_items_with_availability")
      .select("id, extra_group_id, name, price, effective_available, blocking_ingredient")
      .in("id", extraIds);
    if (!first.error) return first;
    if (!isMissingRel(first.error)) return first;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fb = await (supabase as any)
      .from("extra_items")
      .select("id, extra_group_id, name, price, is_available")
      .in("id", extraIds);
    if (fb.error) return fb;
    return {
      ...fb,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (fb.data || []).map((r: any) => ({
        id: r.id,
        extra_group_id: r.extra_group_id,
        name: r.name,
        price: r.price,
        effective_available: r.is_available !== false,
        blocking_ingredient: null,
      })),
    };
  };

  const [menuItemsRes, variantsRes, extrasRes, settingsRes] = await Promise.all([
    fetchMenuItems(),
    variantIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("menu_item_variants")
          .select("id, menu_item_id, name, price_modifier, is_available")
          .in("id", variantIds)
      : Promise.resolve({ data: [], error: null }),
    fetchExtras(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("restaurant_settings")
      .select("base_delivery_fee, min_order_delivery, delivery_enabled")
      .limit(1)
      .maybeSingle(),
  ]);

  if (menuItemsRes.error) throw new Error(menuItemsRes.error.message);
  if (variantsRes.error) throw new Error(variantsRes.error.message);
  if (extrasRes.error) throw new Error(extrasRes.error.message);

  type MenuItemRow = {
    id: string;
    name: string;
    base_price: number;
    /** Vient de la VIEW : inclut la cascade ingredients */
    effective_available: boolean;
    /** Nom du 1er ingredient bloquant (si OOS), pour l'erreur user */
    blocking_ingredient: string | null;
  };
  type VariantRow = {
    id: string;
    menu_item_id: string;
    name: string;
    price_modifier: number;
    is_available: boolean;
  };
  type ExtraRow = {
    id: string;
    extra_group_id: string;
    name: string;
    price: number;
    effective_available: boolean;
    blocking_ingredient: string | null;
  };

  const menuIndex = new Map<string, MenuItemRow>(
    (menuItemsRes.data as MenuItemRow[]).map((m) => [m.id, m])
  );
  const variantIndex = new Map<string, VariantRow>(
    (variantsRes.data as VariantRow[]).map((v) => [v.id, v])
  );
  const extraIndex = new Map<string, ExtraRow>(
    (extrasRes.data as ExtraRow[]).map((e) => [e.id, e])
  );

  const priced: PricedCartItem[] = input.items.map((item) => {
    const menuItem = menuIndex.get(item.menuItemId);
    if (!menuItem) {
      throw new PricingError(
        `Menu item ${item.menuItemId} not found`,
        "ITEM_NOT_FOUND"
      );
    }
    if (!menuItem.effective_available) {
      // Message plus utile : dit quel ingredient manque si c'est la cause
      const reason = menuItem.blocking_ingredient
        ? ` (plus de ${menuItem.blocking_ingredient})`
        : "";
      throw new PricingError(
        `${menuItem.name} non disponible${reason}`,
        "ITEM_UNAVAILABLE",
      );
    }

    let unitPrice = menuItem.base_price;
    let variantName: string | null = null;
    if (item.variantId) {
      const variant = variantIndex.get(item.variantId);
      if (!variant || variant.menu_item_id !== menuItem.id) {
        throw new PricingError(
          `Variant ${item.variantId} invalid for ${menuItem.name}`,
          "VARIANT_NOT_FOUND"
        );
      }
      if (!variant.is_available) {
        throw new PricingError(
          `Variante ${variant.name} non disponible`,
          "VARIANT_UNAVAILABLE"
        );
      }
      unitPrice += variant.price_modifier;
      variantName = variant.name;
    }

    let extrasPrice = 0;
    const extrasJson: PricedCartItem["extrasJson"] = [];
    for (const e of item.extras) {
      const extra = extraIndex.get(e.id);
      if (!extra) {
        throw new PricingError(
          `Extra ${e.id} not found`,
          "EXTRA_NOT_FOUND"
        );
      }
      if (!extra.effective_available) {
        const reason = extra.blocking_ingredient
          ? ` (plus de ${extra.blocking_ingredient})`
          : "";
        throw new PricingError(
          `Supplement ${extra.name} non disponible${reason}`,
          "EXTRA_UNAVAILABLE",
        );
      }
      extrasPrice += extra.price;
      extrasJson.push({ id: extra.id, name: extra.name, price: extra.price });
    }

    return {
      menuItemId: menuItem.id,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      unitPrice,
      extrasPrice,
      itemName: menuItem.name,
      variantName,
      extrasJson,
      specialInstructions: item.specialInstructions ?? null,
    };
  });

  const subtotal = priced.reduce(
    (sum, it) => sum + (it.unitPrice + it.extrasPrice) * it.quantity,
    0
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = (settingsRes.data ?? null) as any;
  // Fallback global si la zone n'a pas de min defini (ne devrait pas arriver
  // avec la nouvelle config, mais defensive).
  const globalMinOrderDelivery =
    settings && typeof settings.min_order_delivery === "number"
      ? settings.min_order_delivery
      : 0;
  const deliveryEnabled =
    settings && typeof settings.delivery_enabled === "boolean"
      ? settings.delivery_enabled
      : true;

  if (input.orderType === "delivery" && !deliveryEnabled) {
    throw new PricingError("La livraison est indisponible", "ITEM_UNAVAILABLE");
  }

  // Zone-based delivery fee + min order — look up city in DELIVERY_ZONES
  let deliveryFee = 0;
  let minOrderForZone = globalMinOrderDelivery;
  if (input.orderType === "delivery") {
    if (!input.deliveryCity) {
      throw new PricingError(
        "Ville de livraison requise",
        "DELIVERY_ZONE_INVALID"
      );
    }
    const zoneFee = getDeliveryFeeForCity(input.deliveryCity);
    if (zoneFee === null) {
      throw new PricingError(
        `Nous ne livrons pas à ${input.deliveryCity}`,
        "DELIVERY_ZONE_INVALID"
      );
    }
    deliveryFee = zoneFee;
    // Min specifique a la zone (15€ Bayonne, 20€ Anglet, 25€, 30€)
    const zoneMin = getMinOrderForCity(input.deliveryCity);
    if (zoneMin !== null) {
      minOrderForZone = zoneMin;
    }
  }

  if (input.orderType === "delivery" && subtotal < minOrderForZone) {
    const euros = (minOrderForZone / 100).toFixed(2).replace(".", ",");
    const cityLabel = input.deliveryCity ? ` a ${input.deliveryCity}` : "";
    throw new PricingError(
      `Minimum de commande pour la livraison${cityLabel} : ${euros} €`,
      "ITEM_UNAVAILABLE",
    );
  }

  const total = subtotal + deliveryFee;

  return { items: priced, subtotal, deliveryFee, total };
}
