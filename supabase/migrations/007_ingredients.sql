-- 007_ingredients.sql
--
-- Systeme d'ingredients avec cascade de disponibilite :
-- - Un ingredient OOS rend indispo tous les items qui l'utilisent
-- - Meme 3 statuts que les items (in_stock / unavailable_today / indefinite)
-- - Junction tables M:N vers menu_items et extra_items
-- - ON DELETE CASCADE pour pas laisser de rows orphelines
--
-- RLS : tout le monde peut LIRE (pour calcul availability cote client),
-- seuls admin + kitchen peuvent INSERT/UPDATE/DELETE.

-- ════════════════════════════════════════════════════════════════════
-- Table ingredients
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  availability_status TEXT NOT NULL DEFAULT 'in_stock'
    CHECK (availability_status IN ('in_stock', 'unavailable_today', 'unavailable_indefinite')),
  unavailable_until TIMESTAMPTZ,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients (name);
CREATE INDEX IF NOT EXISTS idx_ingredients_status
  ON ingredients (availability_status)
  WHERE availability_status != 'in_stock';

-- Trigger : auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ingredients_updated_at ON ingredients;
CREATE TRIGGER trg_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- Junction : menu_item_ingredients
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (menu_item_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_ingredient
  ON menu_item_ingredients (ingredient_id);

-- ════════════════════════════════════════════════════════════════════
-- Junction : extra_item_ingredients
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS extra_item_ingredients (
  extra_id UUID NOT NULL REFERENCES extra_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (extra_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_extra_item_ingredients_ingredient
  ON extra_item_ingredients (ingredient_id);

-- ════════════════════════════════════════════════════════════════════
-- RLS : tout le monde lit (pour cascade availability cote client),
-- staff seul mute.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_item_ingredients ENABLE ROW LEVEL SECURITY;

-- ───── ingredients ─────

DROP POLICY IF EXISTS "Anyone can read ingredients" ON ingredients;
CREATE POLICY "Anyone can read ingredients" ON ingredients
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can insert ingredients" ON ingredients;
CREATE POLICY "Staff can insert ingredients" ON ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );

DROP POLICY IF EXISTS "Staff can update ingredients" ON ingredients;
CREATE POLICY "Staff can update ingredients" ON ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );

-- Only admin can delete (kitchen shouldn't nuke ingredients mid-service)
DROP POLICY IF EXISTS "Admin can delete ingredients" ON ingredients;
CREATE POLICY "Admin can delete ingredients" ON ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::user_role
    )
  );

-- ───── menu_item_ingredients junction ─────

DROP POLICY IF EXISTS "Anyone can read menu_item_ingredients" ON menu_item_ingredients;
CREATE POLICY "Anyone can read menu_item_ingredients" ON menu_item_ingredients
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage menu_item_ingredients" ON menu_item_ingredients;
CREATE POLICY "Staff can manage menu_item_ingredients" ON menu_item_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );

-- ───── extra_item_ingredients junction ─────

DROP POLICY IF EXISTS "Anyone can read extra_item_ingredients" ON extra_item_ingredients;
CREATE POLICY "Anyone can read extra_item_ingredients" ON extra_item_ingredients
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage extra_item_ingredients" ON extra_item_ingredients;
CREATE POLICY "Staff can manage extra_item_ingredients" ON extra_item_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- Realtime : les clients voient la cascade en live
-- ════════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_item_ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE extra_item_ingredients;
