export const BRAND = {
  name: "SOUTH STREET FOOD",
  tagline: "Le street food de Bayonne",
  description:
    "Burgers, tacos et wraps artisanaux. Livraison sur Bayonne-Anglet-Biarritz jusqu'a 4h du matin.",
  phone: "",
  email: "",
  address: "Bayonne, France",
  instagram: "https://instagram.com/southstreetfood",
  snapchat: "https://snapchat.com/add/southstreetfood",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "En attente de paiement",
  paid: "Payee",
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

export const DELIVERY_ZONES = {
  center: { lat: 43.4929, lng: -1.4748 }, // Bayonne center
  maxRadiusKm: 15,
  cities: ["Bayonne", "Anglet", "Biarritz"],
} as const;

export const LOYALTY = {
  pointsPerEuro: 10,
  minPointsRedeem: 100,
} as const;
