-- 009_service_hours_and_status.sql
--
-- Horaires d'ouverture + statut manuel du restaurant :
--
-- 1. Les commandes en ligne sont auto-bloquees hors horaires (Lun-Sam
--    19:00-04:00, Dim 19:00-00:00 heure Paris). Un client qui tente de
--    commander a 14h voit "Ferme - reouverture a 19:00".
--
-- 2. L'admin peut override :
--      manual_status = 'auto'               → respecte les horaires
--      manual_status = 'open'                → ouvert en continu (force)
--      manual_status = 'closed'              → ferme indefiniment (force)
--      manual_status = 'temporarily_closed'  → ferme jusqu'a temp_closed_until
--                                              (puis retombe en 'auto')
--
-- 3. Le reset 'unavailable_today' passe de 05:00 Paris a 19:00 Paris
--    (debut du prochain service). Plus logique : un ingredient marque
--    OOS mercredi revient jeudi 19:00, pas jeudi 05:00.
--    Schedule du cron : toutes les 15 minutes (robustesse DST + precision).

-- ════════════════════════════════════════════════════════════════════
-- 1. Colonnes manual_status + temp_closed_until sur restaurant_settings
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS manual_status TEXT NOT NULL DEFAULT 'auto'
    CHECK (manual_status IN ('auto', 'open', 'closed', 'temporarily_closed')),
  ADD COLUMN IF NOT EXISTS temp_closed_until TIMESTAMPTZ;

-- Migrate l'ancien is_open_override (legacy) vers le nouveau systeme :
--   TRUE  → 'open'
--   FALSE → 'closed'
--   NULL  → 'auto'
-- Une fois migre, is_open_override n'est plus utilise (on le garde pour
-- backward compat mais on ignore en lecture dans le code neuf).
UPDATE restaurant_settings
SET manual_status = CASE
  WHEN is_open_override = true THEN 'open'
  WHEN is_open_override = false THEN 'closed'
  ELSE 'auto'
END
WHERE manual_status = 'auto';

-- ════════════════════════════════════════════════════════════════════
-- 2. Opening hours : planning SSF
--    Lun-Sam : 19:00 → 04:00 (service nocturne, traverse minuit)
--    Dim     : 19:00 → 00:00 (pas de nuit)
--
-- Format JSONB : chaque jour a { open: 'HH:MM', close: 'HH:MM' }
-- Si close < open, ca veut dire que le service se termine le lendemain.
-- (ex: open=19:00 close=04:00 → ouvert 19h-23h59 + 00h00-04h00 le
-- jour SUIVANT).
-- ════════════════════════════════════════════════════════════════════

UPDATE restaurant_settings
SET opening_hours = jsonb_build_object(
  'monday',    jsonb_build_object('open', '19:00', 'close', '04:00'),
  'tuesday',   jsonb_build_object('open', '19:00', 'close', '04:00'),
  'wednesday', jsonb_build_object('open', '19:00', 'close', '04:00'),
  'thursday',  jsonb_build_object('open', '19:00', 'close', '04:00'),
  'friday',    jsonb_build_object('open', '19:00', 'close', '04:00'),
  'saturday',  jsonb_build_object('open', '19:00', 'close', '04:00'),
  'sunday',    jsonb_build_object('open', '19:00', 'close', '00:00')
)
WHERE id = 1;

-- Insert une row par defaut si la table est vide
INSERT INTO restaurant_settings (id, opening_hours, manual_status)
VALUES (
  1,
  jsonb_build_object(
    'monday',    jsonb_build_object('open', '19:00', 'close', '04:00'),
    'tuesday',   jsonb_build_object('open', '19:00', 'close', '04:00'),
    'wednesday', jsonb_build_object('open', '19:00', 'close', '04:00'),
    'thursday',  jsonb_build_object('open', '19:00', 'close', '04:00'),
    'friday',    jsonb_build_object('open', '19:00', 'close', '04:00'),
    'saturday',  jsonb_build_object('open', '19:00', 'close', '04:00'),
    'sunday',    jsonb_build_object('open', '19:00', 'close', '00:00')
  ),
  'auto'
) ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════
-- 3. Fonction auto-reset des temp_closed_until passes vers 'auto'
--    Appelee par le meme cron que le reset stock.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION reset_expired_temp_closed()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset INT;
BEGIN
  UPDATE restaurant_settings
  SET manual_status = 'auto',
      temp_closed_until = NULL
  WHERE manual_status = 'temporarily_closed'
    AND temp_closed_until IS NOT NULL
    AND temp_closed_until <= NOW();
  GET DIAGNOSTICS v_reset = ROW_COUNT;
  RETURN v_reset;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_expired_temp_closed() TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 4. Replace pg_cron schedule : au lieu de 2x par jour a 03h+04h UTC,
--    on run toutes les 15 minutes. Comme ca :
--      - Le reset des 'unavailable_today' s'execute a la bonne heure
--        (19:00 Paris, independemment de DST)
--      - Le reset_expired_temp_closed() marche aussi (15 min max de
--        delai apres qu'un temp_closed soit expire)
-- ════════════════════════════════════════════════════════════════════

-- Unschedule les anciennes crons
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
DO $$
BEGIN
  PERFORM cron.unschedule('reset-stock-and-temp-closed-15min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Nouveau schedule unique : toutes les 15 min, on run les 2 fonctions
SELECT cron.schedule(
  'reset-stock-and-temp-closed-15min',
  '*/15 * * * *',
  $$
    SELECT reset_daily_unavailable();
    SELECT reset_expired_temp_closed();
  $$
);

-- ════════════════════════════════════════════════════════════════════
-- 5. Realtime sur restaurant_settings : permet aux clients de voir
--    l'etat ouvert/ferme changer en direct (admin ferme → banner
--    "Ferme temporairement" apparait sans refresh).
-- ════════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_settings;
