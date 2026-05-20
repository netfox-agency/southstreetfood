-- ============================================================================
-- Server Direct Print : queue de tickets à imprimer en cuisine
-- ============================================================================
--
-- Contexte : l'imprimante thermique en cuisine (Epson TM-m30/m30III sur
-- Ethernet ou WiFi) polle un endpoint Vercel toutes les X secondes. Quand
-- on lui répond avec un payload ePOS-Print XML, elle imprime, puis nous
-- confirme via un autre POST.
--
-- Cette table est la **queue** de tickets en attente d'impression.
--
-- Flow complet :
--   1. Client commande → orders.status passe à 'paid'
--   2. Trigger DB → INSERT print_jobs (status='pending')
--   3. Imprimante POST /api/printer/poll
--   4. Endpoint :
--      - Récupère plus ancien job 'pending' (FIFO)
--      - Génère le ePOS-Print XML du ticket
--      - Marque le job 'in_flight'
--      - Renvoie le XML à l'imprimante
--   5. Imprimante imprime + POST /api/printer/done avec result
--   6. Endpoint marque le job 'printed' (success) ou 'failed' (à retry)
--
-- Si l'imprimante crash en plein print, le job reste 'in_flight'.
-- Un cron job (ou logique côté API) le repasse en 'pending' après 60s
-- → l'imprimante retentera automatiquement.
-- ============================================================================

CREATE TYPE print_job_status AS ENUM (
  'pending',     -- attend d'être servi à l'imprimante
  'in_flight',   -- envoyé à l'imprimante, attend confirmation
  'printed',     -- l'imprimante a confirmé OK
  'failed',      -- échec après plusieurs tentatives, intervention manuelle
  'expired'      -- trop vieux (>1h), abandonné
);

CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status print_job_status NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  served_at TIMESTAMPTZ,   -- quand l'imprimante a recupere le job (in_flight)
  printed_at TIMESTAMPTZ,  -- quand l'imprimante a confirme
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
);

CREATE INDEX print_jobs_status_idx ON print_jobs (status, created_at);
CREATE INDEX print_jobs_order_idx ON print_jobs (order_id);

-- RLS : seul le service_role + admin peuvent voir la queue
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage print jobs"
  ON print_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'kitchen')
    )
  );

-- ─── Trigger : nouvelle commande "paid" → ajoute auto un job ────────────
CREATE OR REPLACE FUNCTION enqueue_print_job_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Seulement quand le status passe a 'paid' (transition, pas re-update)
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    -- Verifie qu'on a pas deja un job pour cette commande
    -- (au cas ou le trigger fire 2x pour une raison ou une autre)
    IF NOT EXISTS (
      SELECT 1 FROM print_jobs
      WHERE order_id = NEW.id
      AND status IN ('pending', 'in_flight', 'printed')
    ) THEN
      INSERT INTO print_jobs (order_id, status)
      VALUES (NEW.id, 'pending');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enqueue_print_job_trigger
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION enqueue_print_job_on_paid();

COMMENT ON TABLE print_jobs IS
  'Server Direct Print queue. L imprimante cuisine polle /api/printer/poll pour recuperer le prochain job pending et imprime.';
