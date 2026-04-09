-- Adds 'dine_in' (sur place) to the order_type enum so customers can
-- order for dine-in service in addition to collect (takeaway) and delivery.
-- Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'order_type' AND e.enumlabel = 'dine_in'
  ) THEN
    ALTER TYPE order_type ADD VALUE 'dine_in';
  END IF;
END $$;
