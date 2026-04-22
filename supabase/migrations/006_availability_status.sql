-- 006_availability_status.sql
--
-- Ajoute un systeme de 3 statuts de disponibilite sur les items, variants et
-- extras, en complement du flag is_available existant (qu'on garde synchro
-- pour compatibilite descendante des queries actuelles).
--
-- Statuts :
--   - 'in_stock'                : dispo (defaut)
--   - 'unavailable_today'       : indispo jusqu'au prochain reset auto
--                                 (cron a 05:00 Paris, apres la fin du service)
--   - 'unavailable_indefinite'  : indispo jusqu'a remise en stock manuelle
--
-- unavailable_until = moment ou ca redevient dispo (utilise par la cron).
-- NULL = pas de retour programme (soit deja dispo, soit indefiniment indispo).

-- ════════════════════════════════════════════════════════════════════
-- menu_items
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'in_stock'
    CHECK (availability_status IN ('in_stock', 'unavailable_today', 'unavailable_indefinite')),
  ADD COLUMN IF NOT EXISTS unavailable_until TIMESTAMPTZ;

-- Backfill : is_available=false → 'unavailable_indefinite' (legacy manuel)
UPDATE menu_items
SET availability_status = 'unavailable_indefinite'
WHERE is_available = false AND availability_status = 'in_stock';

CREATE INDEX IF NOT EXISTS idx_menu_items_availability_status
  ON menu_items (availability_status)
  WHERE availability_status != 'in_stock';

-- ════════════════════════════════════════════════════════════════════
-- menu_item_variants
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE menu_item_variants
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'in_stock'
    CHECK (availability_status IN ('in_stock', 'unavailable_today', 'unavailable_indefinite')),
  ADD COLUMN IF NOT EXISTS unavailable_until TIMESTAMPTZ;

UPDATE menu_item_variants
SET availability_status = 'unavailable_indefinite'
WHERE is_available = false AND availability_status = 'in_stock';

CREATE INDEX IF NOT EXISTS idx_variants_availability_status
  ON menu_item_variants (availability_status)
  WHERE availability_status != 'in_stock';

-- ════════════════════════════════════════════════════════════════════
-- extra_items
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE extra_items
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'in_stock'
    CHECK (availability_status IN ('in_stock', 'unavailable_today', 'unavailable_indefinite')),
  ADD COLUMN IF NOT EXISTS unavailable_until TIMESTAMPTZ;

UPDATE extra_items
SET availability_status = 'unavailable_indefinite'
WHERE is_available = false AND availability_status = 'in_stock';

CREATE INDEX IF NOT EXISTS idx_extras_availability_status
  ON extra_items (availability_status)
  WHERE availability_status != 'in_stock';

-- ════════════════════════════════════════════════════════════════════
-- Realtime : expose les changements aux clients connectes pour que la
-- cascade soit live (client mobile voit les ruptures sans refresh).
-- ════════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_item_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE extra_items;
