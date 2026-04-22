-- 008_availability_cascade_and_cron.sql
--
-- Couche calcul + automation sur la gestion stock :
-- 1. Fonction helper `effective_item_available` pour computer la dispo cascade
-- 2. VIEWs pratiques pour les queries storefront/admin
-- 3. Function + pg_cron schedule : reset auto des 'unavailable_today' a 05:00
--    heure de Paris (apres fermeture du service nocturne, avant prochain service)
-- 4. Table `stock_reset_log` pour suivre les runs du cron et debug

-- ════════════════════════════════════════════════════════════════════
-- Log table pour monitorer les runs cron
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stock_reset_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items_reset INT NOT NULL DEFAULT 0,
  variants_reset INT NOT NULL DEFAULT 0,
  extras_reset INT NOT NULL DEFAULT 0,
  ingredients_reset INT NOT NULL DEFAULT 0,
  notes TEXT
);

ALTER TABLE stock_reset_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read stock_reset_log" ON stock_reset_log;
CREATE POLICY "Admin can read stock_reset_log" ON stock_reset_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- Fonction : reset les statuts 'unavailable_today' dont unavailable_until
-- est passe. Logge le nombre de lignes remises en stock.
-- Idempotent : peut etre rappelee sans souci.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION reset_daily_unavailable()
RETURNS TABLE (
  items_reset INT,
  variants_reset INT,
  extras_reset INT,
  ingredients_reset INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_items INT;
  v_variants INT;
  v_extras INT;
  v_ingredients INT;
BEGIN
  -- menu_items : remet status + is_available en phase
  UPDATE menu_items
  SET availability_status = 'in_stock',
      unavailable_until = NULL,
      is_available = true
  WHERE availability_status = 'unavailable_today'
    AND (unavailable_until IS NULL OR unavailable_until <= NOW());
  GET DIAGNOSTICS v_items = ROW_COUNT;

  UPDATE menu_item_variants
  SET availability_status = 'in_stock',
      unavailable_until = NULL,
      is_available = true
  WHERE availability_status = 'unavailable_today'
    AND (unavailable_until IS NULL OR unavailable_until <= NOW());
  GET DIAGNOSTICS v_variants = ROW_COUNT;

  UPDATE extra_items
  SET availability_status = 'in_stock',
      unavailable_until = NULL,
      is_available = true
  WHERE availability_status = 'unavailable_today'
    AND (unavailable_until IS NULL OR unavailable_until <= NOW());
  GET DIAGNOSTICS v_extras = ROW_COUNT;

  UPDATE ingredients
  SET availability_status = 'in_stock',
      unavailable_until = NULL
  WHERE availability_status = 'unavailable_today'
    AND (unavailable_until IS NULL OR unavailable_until <= NOW());
  GET DIAGNOSTICS v_ingredients = ROW_COUNT;

  -- Log la run pour observability
  INSERT INTO stock_reset_log (items_reset, variants_reset, extras_reset, ingredients_reset)
  VALUES (v_items, v_variants, v_extras, v_ingredients);

  RETURN QUERY SELECT v_items, v_variants, v_extras, v_ingredients;
END;
$$;

COMMENT ON FUNCTION reset_daily_unavailable IS
  'Remet en stock tous les items/variants/extras/ingredients marques "unavailable_today" dont la date unavailable_until est passee. Appelee quotidiennement par pg_cron a 05:00 heure de Paris (03:00 UTC ete / 04:00 UTC hiver) pour couvrir les 2 cas DST.';

-- ════════════════════════════════════════════════════════════════════
-- pg_cron : schedule la fonction reset_daily_unavailable
--
-- On schedule 2 fois : 03:00 UTC et 04:00 UTC. Une des 2 correspond a
-- 05:00 heure de Paris selon DST. L'autre est idempotente (pas de row
-- a reset si la premiere a deja tourne). Simple et robuste vs. DST.
-- ════════════════════════════════════════════════════════════════════

-- Enable pg_cron extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule si deja present (idempotent pour re-runs)
DO $$
BEGIN
  PERFORM cron.unschedule('reset-stock-daily-summer');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('reset-stock-daily-winter');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule les 2 runs journaliers
SELECT cron.schedule(
  'reset-stock-daily-summer',
  '0 3 * * *',  -- 03:00 UTC = 05:00 Paris ete
  $$SELECT reset_daily_unavailable();$$
);

SELECT cron.schedule(
  'reset-stock-daily-winter',
  '0 4 * * *',  -- 04:00 UTC = 05:00 Paris hiver
  $$SELECT reset_daily_unavailable();$$
);

-- ════════════════════════════════════════════════════════════════════
-- Fonction helper : effective availability d'un menu_item
-- = status=in_stock ET tous ses ingredients lies = in_stock
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_menu_item_effectively_available(p_menu_item_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    mi.availability_status = 'in_stock'
    AND mi.is_available = true
    AND NOT EXISTS (
      SELECT 1
      FROM menu_item_ingredients mii
      JOIN ingredients i ON i.id = mii.ingredient_id
      WHERE mii.menu_item_id = p_menu_item_id
        AND i.availability_status != 'in_stock'
    )
  FROM menu_items mi
  WHERE mi.id = p_menu_item_id;
$$;

CREATE OR REPLACE FUNCTION is_extra_item_effectively_available(p_extra_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    ei.availability_status = 'in_stock'
    AND ei.is_available = true
    AND NOT EXISTS (
      SELECT 1
      FROM extra_item_ingredients eii
      JOIN ingredients i ON i.id = eii.ingredient_id
      WHERE eii.extra_id = p_extra_id
        AND i.availability_status != 'in_stock'
    )
  FROM extra_items ei
  WHERE ei.id = p_extra_id;
$$;

-- ════════════════════════════════════════════════════════════════════
-- VIEW pratique : menu_items + effective_available computed
-- Permet aux queries storefront d'avoir directement la dispo cascade.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW menu_items_with_availability AS
SELECT
  mi.*,
  is_menu_item_effectively_available(mi.id) AS effective_available,
  (
    SELECT i.name
    FROM menu_item_ingredients mii
    JOIN ingredients i ON i.id = mii.ingredient_id
    WHERE mii.menu_item_id = mi.id
      AND i.availability_status != 'in_stock'
    ORDER BY i.display_order, i.name
    LIMIT 1
  ) AS blocking_ingredient
FROM menu_items mi;

-- La VIEW herite des RLS de la base table menu_items, tout bien.

-- ════════════════════════════════════════════════════════════════════
-- VIEW pratique : extra_items + effective_available computed
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW extra_items_with_availability AS
SELECT
  ei.*,
  is_extra_item_effectively_available(ei.id) AS effective_available,
  (
    SELECT i.name
    FROM extra_item_ingredients eii
    JOIN ingredients i ON i.id = eii.ingredient_id
    WHERE eii.extra_id = ei.id
      AND i.availability_status != 'in_stock'
    ORDER BY i.display_order, i.name
    LIMIT 1
  ) AS blocking_ingredient
FROM extra_items ei;

-- ════════════════════════════════════════════════════════════════════
-- Grants pour l'acces public aux fonctions (RLS protege la data)
-- ════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION is_menu_item_effectively_available(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_extra_item_effectively_available(UUID) TO anon, authenticated;
