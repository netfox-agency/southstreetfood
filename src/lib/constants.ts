export const BRAND = {
  name: "SOUTH STREET FOOD",
  tagline: "Le street food de Bayonne",
  description:
    "Burgers, tacos et wraps artisanaux. Livraison sur Bayonne-Anglet-Biarritz jusqu'a 4h du matin.",
  phone: "05 59 00 00 00",
  email: "contact@southstreetfood.fr",
  address: "Bayonne, France",
  instagram: "https://www.instagram.com/southstreetfood64",
  snapchat: "https://snapchat.com/add/southstreetfood",
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
  { fee: 300, cities: ["Bayonne"] },
  { fee: 400, cities: ["Anglet", "Tarnos", "Boucau"] },
  { fee: 500, cities: ["Biarritz", "Ondres", "Saint-Martin-de-Seignanx"] },
  { fee: 600, cities: ["Bassussarry", "Bidart", "Saint-André-de-Seignanx", "Labenne", "Saint-Pierre-d'Irube"] },
] as const;

/** All deliverable cities as a flat sorted list */
export const DELIVERY_CITIES = DELIVERY_ZONES.flatMap((z) =>
  z.cities.map((city) => ({ city, fee: z.fee }))
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

export const LOYALTY = {
  pointsPerEuro: 10,
  minPointsRedeem: 100,
} as const;
