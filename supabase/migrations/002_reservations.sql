-- Reservations table for South Street Food
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  party_size INTEGER NOT NULL DEFAULT 2,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  treated_at TIMESTAMPTZ,
  treated_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_created ON reservations(created_at DESC);

-- RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Public can create reservations
CREATE POLICY "Anyone can create reservations" ON reservations
  FOR INSERT WITH CHECK (true);

-- Public can view reservations (for confirmation page)
CREATE POLICY "Anyone can view reservations" ON reservations
  FOR SELECT USING (true);

-- Staff can update reservations
CREATE POLICY "Staff can update reservations" ON reservations
  FOR UPDATE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
