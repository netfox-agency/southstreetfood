/**
 * Types du systeme de gestion de stock (3 statuts + ingredients + cascade).
 * Complemente src/types/database.ts (auto-genere Supabase) avec les tables
 * ajoutees par les migrations 006/007/008.
 */

/** 3 statuts possibles sur items / variants / extras / ingredients */
export type AvailabilityStatus =
  | "in_stock"
  | "unavailable_today"
  | "unavailable_indefinite";

/**
 * Ligne de la table `ingredients`.
 * Un ingredient lie via junction M:N a des menu_items et/ou extra_items.
 */
export interface Ingredient {
  id: string;
  name: string;
  availability_status: AvailabilityStatus;
  unavailable_until: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Junction menu_item ↔ ingredient */
export interface MenuItemIngredient {
  menu_item_id: string;
  ingredient_id: string;
  created_at: string;
}

/** Junction extra_item ↔ ingredient */
export interface ExtraItemIngredient {
  extra_id: string;
  ingredient_id: string;
  created_at: string;
}

/** Row de stock_reset_log (debug/observability du cron) */
export interface StockResetLog {
  id: string;
  run_at: string;
  items_reset: number;
  variants_reset: number;
  extras_reset: number;
  ingredients_reset: number;
  notes: string | null;
}

/**
 * Item affiche sur le storefront avec la disponibilite cascade calculee
 * (inclut le check des ingredients lies). Vient de la VIEW
 * `menu_items_with_availability`.
 */
export interface MenuItemWithAvailability {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  category_id: string;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  allergens: string[] | null;
  availability_status: AvailabilityStatus;
  unavailable_until: string | null;
  created_at: string;
  updated_at: string;
  /** True si l'item ET tous ses ingredients lies sont in_stock */
  effective_available: boolean;
  /**
   * Nom du premier ingredient OOS qui bloque l'item, ou null si dispo.
   * Utile pour afficher "Indispo : plus de bacon" cote admin/cuisine.
   */
  blocking_ingredient: string | null;
}

/**
 * Reponse de /api/admin/ingredients/[id] quand on fetch un ingredient
 * avec la liste des items lies (pour affichage preview).
 */
export interface IngredientWithLinks extends Ingredient {
  menu_item_ids: string[];
  extra_item_ids: string[];
}

/** Payload pour /api/kitchen/menu/toggle etendu */
export interface ToggleAvailabilityPayload {
  entity: "menu_item" | "variant" | "extra_item" | "ingredient";
  id: string;
  status: AvailabilityStatus;
  /** Optionnel : override le calcul auto de unavailable_until */
  unavailable_until?: string | null;
}

/**
 * Calcule la date de reset auto quand on passe un item/ingredient a
 * 'unavailable_today'. Reset = 05:00 heure de Paris le prochain jour
 * (apres la fin du service nocturne qui s'arrete a 04:00).
 *
 * Si appele avant 05:00 Paris du jour courant, le reset est aujourd'hui
 * a 05:00 (pratiquement = quelques minutes/heures plus tard).
 * Sinon, c'est demain 05:00 Paris.
 */
export function computeNextResetAt(now: Date = new Date()): string {
  // Parse "now" dans le fuseau Paris
  const parisFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = parisFormatter.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  const hour = parseInt(get("hour"), 10);

  // Construit "YYYY-MM-DDT05:00:00" a Paris, puis traduit en UTC ISO
  // via l'offset courant. Utilise un trick Date parsing +02:00/+01:00.
  // Pour simplifier et rester correct, on build la date en interpretant
  // "05:00 Paris" comme un UTC avec l'offset approprie.
  const parisDate = new Date(
    Date.UTC(year, month - 1, day, 5, 0, 0),
  );
  // Aligne sur l'offset Paris : on retranche l'offset Paris pour ramener en UTC
  const parisOffsetMin = getParisOffsetMinutes(parisDate);
  parisDate.setUTCMinutes(parisDate.getUTCMinutes() - parisOffsetMin);

  // Si on est deja apres 05:00 Paris aujourd'hui, on decale a demain
  if (hour >= 5) {
    parisDate.setUTCDate(parisDate.getUTCDate() + 1);
  }

  return parisDate.toISOString();
}

/** Retourne l'offset de Europe/Paris (en minutes) pour une date donnee */
function getParisOffsetMinutes(date: Date): number {
  // DateTimeFormat ne donne pas l'offset directement. On le deduit via diff.
  const utcString = date.toLocaleString("en-US", { timeZone: "UTC" });
  const parisString = date.toLocaleString("en-US", { timeZone: "Europe/Paris" });
  const utcMs = new Date(utcString).getTime();
  const parisMs = new Date(parisString).getTime();
  return Math.round((parisMs - utcMs) / 60_000);
}
