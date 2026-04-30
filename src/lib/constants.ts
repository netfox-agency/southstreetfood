export const BRAND = {
  name: "SOUTH STREET FOOD",
  tagline: "Le street food de Bayonne",
  description:
    "Burgers, tacos et wraps artisanaux. Livraison sur Bayonne-Anglet-Biarritz jusqu'a 4h du matin.",
  phone: "07 69 79 91 89",
  email: "contact@southstreetfood.fr",
  address: "32 Chemin de Loustaunaou, 64100 Bayonne",
  instagram: "https://www.instagram.com/southstreetfood64",
  tiktok: "https://www.tiktok.com/@south.street.food",
  snapchat: "https://www.snapchat.com/add/southstreetfood",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "En attente",
  paid: "Nouvelle",
  accepted: "Acceptee",
  preparing: "En preparation",
  ready: "Prete",
  out_for_delivery: "En livraison",
  delivered: "Livree",
  picked_up: "Recuperee",
  cancelled: "Annulee",
  refunded: "Remboursee",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-warning text-warning-foreground",
  paid: "bg-brand-purple text-white",
  accepted: "bg-brand-purple-light text-white",
  preparing: "bg-brand-yellow text-black",
  ready: "bg-brand-green text-white",
  out_for_delivery: "bg-brand-pink text-white",
  delivered: "bg-brand-green text-white",
  picked_up: "bg-brand-green text-white",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-muted text-muted-foreground",
};

/**
 * Delivery zones — each zone has a fee (in cents) and a list of cities.
 * Ordered from cheapest to most expensive for display.
 */
export const DELIVERY_ZONES = [
  { fee: 300, minOrder: 1500, cities: ["Bayonne"] },
  { fee: 400, minOrder: 2000, cities: ["Anglet", "Tarnos", "Boucau"] },
  { fee: 500, minOrder: 2500, cities: ["Biarritz", "Ondres", "Saint-Martin-de-Seignanx"] },
  { fee: 600, minOrder: 3000, cities: ["Bassussarry", "Bidart", "Saint-André-de-Seignanx", "Labenne", "Saint-Pierre-d'Irube"] },
] as const;

/** All deliverable cities as a flat sorted list */
export const DELIVERY_CITIES = DELIVERY_ZONES.flatMap((z) =>
  z.cities.map((city) => ({ city, fee: z.fee, minOrder: z.minOrder })),
).sort((a, b) => a.city.localeCompare(b.city, "fr"));

/** Restaurant coordinates for map centering */
export const RESTAURANT_LOCATION = { lat: 43.4929, lng: -1.4748 } as const;

/** Strip accents for city name comparison (Google may return different formats) */
function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['']/g, "'");
}

/** Get delivery fee for a city (case-insensitive, accent-insensitive). Returns null if not deliverable. */
export function getDeliveryFeeForCity(city: string): number | null {
  const normalized = stripAccents(city.trim()).toLowerCase();
  for (const zone of DELIVERY_ZONES) {
    if (zone.cities.some((c) => stripAccents(c).toLowerCase() === normalized)) {
      return zone.fee;
    }
  }
  return null;
}

/**
 * Min order amount (cents) for a delivery city. Returns null if not deliverable.
 * Utilise cote serveur (priceCartServerSide) ET cote client (cart UI).
 * Plus la zone est loin, plus le minimum monte (rentabilite livreur).
 */
export function getMinOrderForCity(city: string): number | null {
  const normalized = stripAccents(city.trim()).toLowerCase();
  for (const zone of DELIVERY_ZONES) {
    if (zone.cities.some((c) => stripAccents(c).toLowerCase() === normalized)) {
      return zone.minOrder;
    }
  }
  return null;
}

export const LOYALTY = {
  /** 1 euro depense = 1 point gagne (sur commande terminee uniquement). */
  pointsPerEuro: 1,
  /** Palier minimum pour debloquer une recompense. */
  minPointsRedeem: 100,
} as const;

/**
 * Menu (formule +3€) — items eligible to be upgraded to "Menu".
 * A Menu = item + drink 33cl + frites for +3€ flat.
 *   - Drinks: any standard 33cl included, Red Bull +1€ supplement
 *   - Frites: salées included, Cheddar +1.50€, Cheddar Bacon +2.50€
 */
export const MENU_UPGRADE_PRICE = 300; // +3€ in cents to go "en menu"

export const MENU_ELIGIBLE_SLUGS: readonly string[] = [
  // Burgers
  "cheeseburger",
  "montagnard-burger",
  "le-big-mc",
  "big-cheeseburger",
  "le-180",
  // Wraps & Roll
  "wrap-poulet",
  "wrap-steak",
  "wrap-kebab",
  "roll",
  // Tacos & Bowl
  "tacos-m",
  "tacos-l",
  "tacos-xl",
  "bowl-m",
  "bowl-l",
  "bowl-xl",
] as const;

/** Slug prefixes for drinks that cost extra in a Menu. */
export const MENU_DRINK_SUPPLEMENTS: Record<string, number> = {
  "red-bull": 100, // +1€ for Red Bull
};

/** Frites options in a Menu, with price delta from salée (included). */
export const MENU_FRIES_OPTIONS = [
  { slug: "frites-sale", label: "Frites salées", supplement: 0 },
  { slug: "frites-cheddar", label: "Frites Cheddar", supplement: 150 },
  { slug: "frites-cheddar-bacon", label: "Frites Cheddar Bacon", supplement: 250 },
] as const;
