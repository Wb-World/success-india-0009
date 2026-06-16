-- success team seminar booking migration
-- Run this once against the deployed Supabase/Postgres database.

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_bus_id_fkey;

ALTER TABLE public.bookings
  ALTER COLUMN bus_id DROP NOT NULL,
  ALTER COLUMN bus_name DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS seminar_id TEXT,
  ADD COLUMN IF NOT EXISTS seminar_name TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_seminar_id
  ON public.bookings(seminar_id);

