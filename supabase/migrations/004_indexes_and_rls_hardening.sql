-- 004_indexes_and_rls_hardening.sql
--
-- 1. Additional indexes to support the hot query paths:
--    - kitchen board filters by order_type
--    - Stripe webhook lookups by stripe_payment_intent_id (idempotence)
--    - menu item detail joins (variants, extras)
--    - customer phone lookups on reservations
--
-- 2. Close PII leaks: the original schema gave anonymous visitors SELECT
--    access to every row in `orders`, `order_items`, `delivery_addresses`
--    and `reservations`. Staff + owner policies already exist, so we just
--    drop the "Anyone can view *" catch-alls. Guest order tracking now
--    goes through the server-side /api/orders/[id]/track route using the
--    service-role key (which bypasses RLS) — the browser no longer needs
--    SELECT on orders for anonymous guests.

-- ------------------------------------------------------------------
-- 1. Indexes
-- ------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_orders_order_type
  ON orders(order_type);

-- Partial index — only the subset of rows that has a Stripe PI set.
-- Used by the webhook idempotence check.
CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi
  ON orders(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_menu_item_variants_item
  ON menu_item_variants(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_menu_item_extra_groups_item
  ON menu_item_extra_groups(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_extra_items_group
  ON extra_items(extra_group_id);

CREATE INDEX IF NOT EXISTS idx_reservations_phone
  ON reservations(customer_phone);

-- ------------------------------------------------------------------
-- 2. RLS hardening
-- ------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view orders by id" ON orders;
DROP POLICY IF EXISTS "Anyone can view order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can view delivery addresses" ON delivery_addresses;
DROP POLICY IF EXISTS "Anyone can view reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can update reservations" ON reservations;

CREATE POLICY "Kitchen/Admin can view reservations" ON reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );

CREATE POLICY "Kitchen/Admin can update reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['kitchen'::user_role, 'admin'::user_role])
    )
  );
