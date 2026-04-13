-- 005_staff_menu_update_policy.sql
--
-- Allow kitchen/admin staff to update menu_items, menu_item_variants,
-- and extra_items directly from the browser client (used by admin menu
-- management page for toggling availability, featured status, and images).

-- menu_items: staff can update
DROP POLICY IF EXISTS "Staff can update menu items" ON menu_items;
CREATE POLICY "Staff can update menu items" ON menu_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );

-- menu_item_variants: staff can update (for toggling variant availability)
DROP POLICY IF EXISTS "Staff can update variants" ON menu_item_variants;
CREATE POLICY "Staff can update variants" ON menu_item_variants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );

-- extra_items: staff can update (for toggling extra availability)
DROP POLICY IF EXISTS "Staff can update extras" ON extra_items;
CREATE POLICY "Staff can update extras" ON extra_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );
