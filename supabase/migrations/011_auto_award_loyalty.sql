-- 011_auto_award_loyalty.sql
--
-- Plan-eng-review finding P0-1 : l'award des points fidelite se faisait
-- via fetch('/api/loyalty/award') cote client, avec .catch() silencieux.
-- Si le network blip (wifi cuisine, cold start, etc.), les points etaient
-- perdus pour toujours.
--
-- Fix : DB trigger sur UPDATE orders qui detecte la transition vers
-- status terminal (picked_up / delivered / out_for_delivery) et credite
-- les points dans la MEME transaction que le status update. Zero network,
-- zero failure mode additionnel.
--
-- Le trigger fonctionne en interaction avec guard_profile_privilege_change
-- (migration 010) grace a un flag transaction-local app.auto_award_in_progress.
--
-- Idempotence : si loyalty_points_earned > 0 deja, skip. Si transition
-- picked_up → delivered (les deux terminaux), skip (meme status group).

-- ═════════════════════════════════════════════════════════════════
-- Trigger auto-award : sur transition vers status terminal
-- ═════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.auto_award_loyalty_on_terminal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  pts integer;
  terminal_statuses text[] := ARRAY['picked_up', 'delivered', 'out_for_delivery'];
BEGIN
  IF NEW.status::text NOT IN (SELECT unnest(terminal_statuses)) THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.loyalty_points_earned IS NOT NULL AND NEW.loyalty_points_earned > 0 THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id) THEN RETURN NEW; END IF;

  pts := FLOOR(NEW.total / 100.0)::integer;
  IF pts <= 0 THEN RETURN NEW; END IF;

  NEW.loyalty_points_earned := pts;

  -- Flag transaction-local pour que guard_profile_privilege_change
  -- autorise l'UPDATE loyalty_points qui suit (il serait sinon bloque
  -- car auth.uid() est le kitchen staff, pas admin).
  PERFORM set_config('app.auto_award_in_progress', 'on', true);

  UPDATE profiles
    SET loyalty_points = COALESCE(loyalty_points, 0) + pts
    WHERE id = NEW.user_id;

  INSERT INTO loyalty_transactions (user_id, order_id, points, description)
    VALUES (NEW.user_id, NEW.id, pts, 'Points gagnes');

  PERFORM set_config('app.auto_award_in_progress', 'off', true);

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS auto_award_loyalty_trigger ON orders;
CREATE TRIGGER auto_award_loyalty_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION auto_award_loyalty_on_terminal();

-- ═════════════════════════════════════════════════════════════════
-- guard_profile_privilege_change : reconnaitre le flag auto_award
-- pour laisser passer le credit legitime, tout en gardant role locked
-- ═════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.guard_profile_privilege_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role) THEN
    RETURN NEW;
  END IF;

  -- Si le flag auto_award_in_progress est actif (dans la meme transaction),
  -- on autorise le changement de loyalty_points — c'est le trigger legitime.
  -- role reste verrouille dans tous les cas.
  IF current_setting('app.auto_award_in_progress', true) = 'on' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'ROLE_LOCKED';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points THEN
    RAISE EXCEPTION 'FIDELITE_LOCKED';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'ROLE_LOCKED';
  END IF;

  RETURN NEW;
END;
$fn$;

-- ═════════════════════════════════════════════════════════════════
-- guard_order_tampering : accepter l'award auto (null/0 → floor(total/100))
-- declenche par le trigger. Les tampering restent bloques.
-- ═════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.guard_order_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  expected_pts integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.loyalty_points_earned IS DISTINCT FROM OLD.loyalty_points_earned THEN
    expected_pts := FLOOR(NEW.total / 100.0)::integer;
    IF (OLD.loyalty_points_earned IS NULL OR OLD.loyalty_points_earned = 0)
       AND NEW.loyalty_points_earned > 0
       AND NEW.loyalty_points_earned = expected_pts
       AND NEW.status::text IN ('picked_up', 'delivered', 'out_for_delivery')
       AND NEW.user_id IS NOT NULL
    THEN
      NULL; -- Award auto legitime
    ELSE
      RAISE EXCEPTION 'ORDER_LOCKED:loyalty_points_earned';
    END IF;
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
