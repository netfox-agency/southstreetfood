-- ============================================================================
-- Loyalty v3 : système de paliers (tier-based)
-- ============================================================================
--
-- Refonte du programme fidélité.
-- AVANT : 10 rewards individuelles ("Le Big Mc à 150 pts", etc.) → le client
--         choisit UNE récompense spécifique parmi une liste à plat.
--
-- APRÈS : 6 paliers structurés. Chaque palier définit ce qui est offert
--         (slot_main / slot_fries / slot_drink / slot_dessert) ET les règles
--         d'éligibilité (catégories autorisées, items exclus). Le client
--         choisit son item parmi les items éligibles au moment du redemption.
--
--   Palier 1 (50 pts)  : 1 boisson
--   Palier 2 (75 pts)  : 1 dessert
--   Palier 3 (100 pts) : 1 sandwich (hors XL/Montagnard/180)
--   Palier 4 (125 pts) : 1 sandwich + 1 frites (hors XL/Montagnard/180)
--   Palier 5 (150 pts) : 1 menu (hors XL/Montagnard/180)
--   Palier 6 (200 pts) : 1 menu (tous sandwichs) + 1 dessert
--
-- Sécurité : la PG function consume_loyalty_v3 valide TOUT côté serveur :
--   - balance >= points_cost (atomique)
--   - items choisis appartiennent aux categories autorisées
--   - items choisis ne sont PAS dans la liste d'exclusion
--   - tous les slots du palier sont remplis (pas de partial redemption)
-- Le client peut envoyer n'importe quoi, le serveur ne fait jamais confiance.
-- ============================================================================

-- ─── 1. Nouvelles colonnes sur loyalty_rewards ────────────────────────────
ALTER TABLE loyalty_rewards
  ADD COLUMN IF NOT EXISTS tier_level INTEGER,
  ADD COLUMN IF NOT EXISTS slot_main BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slot_fries BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slot_drink BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slot_dessert BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS main_categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_slugs TEXT[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS loyalty_rewards_tier_level_unique
  ON loyalty_rewards (tier_level)
  WHERE tier_level IS NOT NULL;

-- ─── 2. Wipe des anciennes rewards ────────────────────────────────────────
-- (Cascade sur orders.loyalty_reward_id en SET NULL pour préserver l'historique)
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_loyalty_reward_id_fkey;
ALTER TABLE orders
  ADD CONSTRAINT orders_loyalty_reward_id_fkey
  FOREIGN KEY (loyalty_reward_id) REFERENCES loyalty_rewards(id) ON DELETE SET NULL;

DELETE FROM loyalty_rewards;

-- ─── 3. Insert les 6 paliers ──────────────────────────────────────────────
-- Catégories "main" éligibles aux paliers 3-6 :
--   burgers-premium, wraps, compose (tacos + bowls)
-- Exclusions communes (paliers 3-5) : Montagnard, 180, Tacos XL, Bowl XL
-- Palier 6 : pas d'exclusion (tout autorisé)

INSERT INTO loyalty_rewards (
  name, description, points_cost, reward_type, is_active,
  tier_level, slot_main, slot_fries, slot_drink, slot_dessert,
  main_categories, excluded_slugs
) VALUES
  ('Palier 1', '1 boisson au choix offerte', 50, 'tier', true,
   1, false, false, true, false, '{}', '{}'),

  ('Palier 2', '1 dessert au choix offert', 75, 'tier', true,
   2, false, false, false, true, '{}', '{}'),

  ('Palier 3', '1 sandwich au choix offert', 100, 'tier', true,
   3, true, false, false, false,
   '{burgers-premium,wraps,compose}',
   '{montagnard-burger,le-180,tacos-xl,bowl-xl}'),

  ('Palier 4', '1 sandwich + 1 frites offerts', 125, 'tier', true,
   4, true, true, false, false,
   '{burgers-premium,wraps,compose}',
   '{montagnard-burger,le-180,tacos-xl,bowl-xl}'),

  ('Palier 5', '1 menu offert (sandwich + frites + boisson)', 150, 'tier', true,
   5, true, true, true, false,
   '{burgers-premium,wraps,compose}',
   '{montagnard-burger,le-180,tacos-xl,bowl-xl}'),

  ('Palier 6', '1 menu offert (au choix) + 1 dessert', 200, 'tier', true,
   6, true, true, true, true,
   '{burgers-premium,wraps,compose}',
   '{}');

-- ─── 4. PG function : valide + débite atomiquement ────────────────────────
-- Appelée à la création de commande. Soit tout passe, soit rien.
--
-- Paramètres :
--   p_user_id      : user qui échange
--   p_reward_id    : ID du palier
--   p_main_id      : menu_item_id choisi pour le slot sandwich (NULL si pas requis)
--   p_fries_id     : menu_item_id choisi pour le slot frites (NULL si pas requis)
--   p_drink_id     : menu_item_id choisi pour le slot boisson (NULL si pas requis)
--   p_dessert_id   : menu_item_id choisi pour le slot dessert (NULL si pas requis)
--
-- Retourne :
--   {success: bool, error: text, new_balance: int, free_item_ids: uuid[]}
--   free_item_ids = liste des items à mettre à 0€ dans la commande

CREATE OR REPLACE FUNCTION consume_loyalty_v3(
  p_user_id   UUID,
  p_reward_id UUID,
  p_main_id   UUID DEFAULT NULL,
  p_fries_id  UUID DEFAULT NULL,
  p_drink_id  UUID DEFAULT NULL,
  p_dessert_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward     RECORD;
  v_balance    INTEGER;
  v_free_ids   UUID[] := '{}';
  v_item_slug  TEXT;
  v_item_cat   TEXT;
BEGIN
  -- Lock le profile pour update atomique
  SELECT loyalty_points INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found');
  END IF;

  -- Récupère le palier
  SELECT * INTO v_reward
  FROM loyalty_rewards
  WHERE id = p_reward_id AND is_active = true AND reward_type = 'tier';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'reward_not_found_or_inactive');
  END IF;

  -- Balance suffisante ?
  IF v_balance < v_reward.points_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_points');
  END IF;

  -- Valide chaque slot requis
  -- SLOT MAIN
  IF v_reward.slot_main THEN
    IF p_main_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'main_required');
    END IF;
    SELECT mi.slug, c.slug INTO v_item_slug, v_item_cat
    FROM menu_items mi
    JOIN categories c ON c.id = mi.category_id
    WHERE mi.id = p_main_id AND mi.is_available = true;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'main_not_available');
    END IF;
    IF NOT (v_item_cat = ANY(v_reward.main_categories)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'main_category_not_eligible');
    END IF;
    IF v_item_slug = ANY(v_reward.excluded_slugs) THEN
      RETURN jsonb_build_object('success', false, 'error', 'main_excluded');
    END IF;
    v_free_ids := array_append(v_free_ids, p_main_id);
  END IF;

  -- SLOT FRIES (doit être dans la catégorie "patate")
  IF v_reward.slot_fries THEN
    IF p_fries_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'fries_required');
    END IF;
    SELECT c.slug INTO v_item_cat
    FROM menu_items mi
    JOIN categories c ON c.id = mi.category_id
    WHERE mi.id = p_fries_id AND mi.is_available = true;
    IF NOT FOUND OR v_item_cat != 'patate' THEN
      RETURN jsonb_build_object('success', false, 'error', 'fries_invalid');
    END IF;
    v_free_ids := array_append(v_free_ids, p_fries_id);
  END IF;

  -- SLOT DRINK (catégorie "boissons")
  IF v_reward.slot_drink THEN
    IF p_drink_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'drink_required');
    END IF;
    SELECT c.slug INTO v_item_cat
    FROM menu_items mi
    JOIN categories c ON c.id = mi.category_id
    WHERE mi.id = p_drink_id AND mi.is_available = true;
    IF NOT FOUND OR v_item_cat != 'boissons' THEN
      RETURN jsonb_build_object('success', false, 'error', 'drink_invalid');
    END IF;
    v_free_ids := array_append(v_free_ids, p_drink_id);
  END IF;

  -- SLOT DESSERT (catégorie "desserts")
  IF v_reward.slot_dessert THEN
    IF p_dessert_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'dessert_required');
    END IF;
    SELECT c.slug INTO v_item_cat
    FROM menu_items mi
    JOIN categories c ON c.id = mi.category_id
    WHERE mi.id = p_dessert_id AND mi.is_available = true;
    IF NOT FOUND OR v_item_cat != 'desserts' THEN
      RETURN jsonb_build_object('success', false, 'error', 'dessert_invalid');
    END IF;
    v_free_ids := array_append(v_free_ids, p_dessert_id);
  END IF;

  -- Tout est valide. Débite.
  -- Flag pour bypass le guard trigger (loyalty_points est modifiable via cette function)
  PERFORM set_config('app.auto_award_in_progress', 'true', true);

  UPDATE profiles
  SET loyalty_points = loyalty_points - v_reward.points_cost,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log la transaction
  INSERT INTO loyalty_transactions (
    user_id, points, description, created_at
  ) VALUES (
    p_user_id,
    -v_reward.points_cost,
    v_reward.description,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_balance - v_reward.points_cost,
    'free_item_ids', to_jsonb(v_free_ids),
    'points_cost', v_reward.points_cost
  );
END;
$$;

GRANT EXECUTE ON FUNCTION consume_loyalty_v3 TO authenticated, service_role;

-- ─── 5. Refund function pour rollback en cas d'echec post-debit ───────────
-- (existante : refund_loyalty_points — reste compatible, prend juste user + amount)
-- Pas de changement.

COMMENT ON FUNCTION consume_loyalty_v3 IS
  'Loyalty v3 : valide un palier + items choisis, debite les points atomique, retourne les item_ids a appliquer en gratuit dans la commande.';
