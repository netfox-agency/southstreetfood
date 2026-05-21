-- ============================================================================
-- Mode urgence : kill-switch online ordering
-- ============================================================================
--
-- Filet de securite quand le systeme bug en plein service (Stripe down,
-- imprimante crashee, livreur en panne...). L'admin (ou la cuisine en cas
-- d'urgence) flip le toggle et :
--   - La carte reste visible (les clients voient toujours le menu)
--   - Les boutons "Ajouter au panier" sont desactives
--   - /cart et /checkout redirigent vers /menu
--   - Un banner rouge en haut affiche le numero de tel avec un gros CTA
--     "Appeler pour commander"
--
-- Auto-disable apres 4h pour eviter qu'on oublie d'eteindre.
-- La cuisine peut activer mais pas desactiver (anti-fat-finger).
-- ============================================================================

ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS emergency_mode_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS emergency_mode_message TEXT,
  ADD COLUMN IF NOT EXISTS emergency_mode_activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS emergency_mode_activated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS emergency_mode_auto_disable_at TIMESTAMPTZ;

-- ─── Auto-disable apres 4h ────────────────────────────────────────────
-- Le cron toutes les 15 min appelle cette fonction et flip le mode urgence
-- a OFF si l'heure d'expiration est passee. Evite le scenario "on a oublie
-- d'eteindre, le site bloque les commandes toute la semaine".
CREATE OR REPLACE FUNCTION auto_disable_emergency_mode()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset INT;
BEGIN
  UPDATE restaurant_settings
  SET emergency_mode_active = FALSE,
      emergency_mode_auto_disable_at = NULL
  WHERE emergency_mode_active = TRUE
    AND emergency_mode_auto_disable_at IS NOT NULL
    AND emergency_mode_auto_disable_at <= NOW();
  GET DIAGNOSTICS v_reset = ROW_COUNT;
  RETURN v_reset;
END;
$$;

GRANT EXECUTE ON FUNCTION auto_disable_emergency_mode() TO anon, authenticated;

-- ─── Log table : qui a flip le switch et quand ────────────────────────
CREATE TABLE IF NOT EXISTS emergency_mode_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('activated', 'deactivated', 'auto_disabled')),
  actor_id UUID REFERENCES profiles(id),
  actor_role TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS emergency_mode_logs_created_idx
  ON emergency_mode_logs (created_at DESC);

ALTER TABLE emergency_mode_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and kitchen read emergency logs"
  ON emergency_mode_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'kitchen')
    )
  );

-- ─── Add to existing cron (run with stock + temp_closed reset) ────────
-- On unschedule l'ancien et reinstalle pour ajouter auto_disable_emergency.
DO $$
BEGIN
  PERFORM cron.unschedule('reset-stock-and-temp-closed-15min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'reset-stock-and-temp-closed-15min',
  '*/15 * * * *',
  $$
    SELECT reset_daily_unavailable();
    SELECT reset_expired_temp_closed();
    SELECT auto_disable_emergency_mode();
  $$
);

COMMENT ON COLUMN restaurant_settings.emergency_mode_active IS
  'Si TRUE, la commande en ligne est desactivee (kill-switch). La carte reste visible, banner + CTA telephone.';
