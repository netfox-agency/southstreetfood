-- 010_loyalty_security_hardening.sql
--
-- Verrouille le systeme de fidelite contre la fraude.
--
-- Avant ce patch, 3 failles majeures etaient exploitables par un user
-- connecte via PostgREST direct :
--
--   1) UPDATE profiles SET loyalty_points = 999999 WHERE id = self
--      → Un attaquant s'attribuait n'importe quel solde en 1 requete.
--
--   2) INSERT INTO orders (user_id, status, loyalty_points_earned)
--      VALUES (self, 'picked_up', 10000)
--      → Attaquant creait une fake commande "picked_up" avec points.
--
--   3) UPDATE profiles SET role = 'admin' WHERE id = self
--      → Escalade de privileges.
--
-- Exploits reproduits live sur prod avant le patch. Tous bloques apres.
--
-- La defense repose sur 3 mecanismes :
--   A. Trigger BEFORE UPDATE sur profiles  → bloque changement de
--      loyalty_points / role par un non-admin.
--   B. Trigger BEFORE UPDATE sur orders    → bloque tampering de
--      loyalty_points_earned / loyalty_reward_id / total / subtotal /
--      user_id / discount_amount par un non-admin.
--   C. Suppression de la policy "Anyone can create orders" et
--      "Anyone can insert order items" → toute creation doit passer
--      par /api/orders (server-authoritative pricing + auth check).
--      Le server utilise createAdminClient() qui bypasse RLS, donc
--      le flow legitime n'est pas impacte.
--
-- Tous les triggers font un early-return si auth.uid() IS NULL (= service
-- role de notre backend) ou si le user est admin. Les clients normaux
-- sont bloques. C'est intentionnel.

-- ═════════════════════════════════════════════════════════════════
-- A. Profile privilege lock (loyalty_points + role)
-- ═════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.guard_profile_privilege_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- Service role bypass
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admin bypass
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RETURN NEW;
  END IF;

  -- Utilisateur normal : loyalty_points et role verrouilles
  IF NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points THEN
    RAISE EXCEPTION 'FIDELITE_LOCKED: loyalty_points ne peut pas etre modifie cote client';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'ROLE_LOCKED: role ne peut pas etre modifie cote client';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS guard_profile_privilege_change_trigger ON profiles;
CREATE TRIGGER guard_profile_privilege_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION guard_profile_privilege_change();

-- ═════════════════════════════════════════════════════════════════
-- B. Order tampering lock (montants + fidelite + user_id)
-- ═════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.guard_order_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RETURN NEW;
  END IF;

  IF NEW.loyalty_points_earned IS DISTINCT FROM OLD.loyalty_points_earned THEN
    RAISE EXCEPTION 'ORDER_LOCKED:loyalty_points_earned';
  END IF;
  IF NEW.loyalty_reward_id IS DISTINCT FROM OLD.loyalty_reward_id THEN
    RAISE EXCEPTION 'ORDER_LOCKED:loyalty_reward_id';
  END IF;
  IF NEW.total IS DISTINCT FROM OLD.total THEN
    RAISE EXCEPTION 'ORDER_LOCKED:total';
  END IF;
  IF NEW.subtotal IS DISTINCT FROM OLD.subtotal THEN
    RAISE EXCEPTION 'ORDER_LOCKED:subtotal';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'ORDER_LOCKED:user_id';
  END IF;
  IF NEW.discount_amount IS DISTINCT FROM OLD.discount_amount THEN
    RAISE EXCEPTION 'ORDER_LOCKED:discount_amount';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS guard_order_tampering_trigger ON orders;
CREATE TRIGGER guard_order_tampering_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION guard_order_tampering();

-- ═════════════════════════════════════════════════════════════════
-- C. Empecher creation directe de commandes via PostgREST
-- Toute creation doit passer par /api/orders (server-authoritative).
-- ═════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
