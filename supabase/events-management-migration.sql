-- success team dynamic seminar event management migration
-- Run this in Supabase SQL Editor before using the Admin add event form.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.events (
  id             TEXT        PRIMARY KEY,
  title          TEXT        NOT NULL,
  venue          TEXT        NOT NULL,
  event_datetime TIMESTAMPTZ NOT NULL,
  price          INTEGER     NOT NULL DEFAULT 0,
  total_seats    INTEGER     NOT NULL DEFAULT 60,
  status         TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_datetime    ON public.events(event_datetime);
CREATE INDEX IF NOT EXISTS idx_events_status      ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_venue_title ON public.events(venue, title);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_public_read" ON public.events;
CREATE POLICY "events_public_read"
  ON public.events FOR SELECT
  USING (status = 'active');

ALTER TABLE public.buses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Available to Register';

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_bus_id_fkey;

ALTER TABLE public.bookings
  ALTER COLUMN bus_id DROP NOT NULL,
  ALTER COLUMN bus_name DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS seminar_id TEXT,
  ADD COLUMN IF NOT EXISTS seminar_name TEXT;

INSERT INTO public.events (id, title, venue, event_datetime, price, total_seats, status) VALUES
  ('seminar_101', 'success team Leadership Development Seminar', 'Chromepet, Chennai', '2026-06-21T10:00:00+05:30', 250, 60, 'active'),
  ('seminar_102', 'Weekly Income Strategy Session', 'Tambaram', '2026-06-22T18:00:00+05:30', 250, 60, 'active'),
  ('seminar_103', 'BOSS Agro Hub Chapter Meetup', 'Pallavaram', '2026-06-23T17:30:00+05:30', 250, 60, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.buses (id, name, type, status, source, destination, price, duration, times) VALUES
  ('seminar_101', 'success team Leadership Development Seminar', 'success team Seminar Event', 'Available to Register', 'Chromepet, Chennai', 'success team Leadership Development Seminar', 250, 'Scheduled Program', ARRAY['10:00 AM']),
  ('seminar_102', 'Weekly Income Strategy Session', 'success team Seminar Event', 'Available to Register', 'Tambaram', 'Weekly Income Strategy Session', 250, 'Scheduled Program', ARRAY['06:00 PM']),
  ('seminar_103', 'BOSS Agro Hub Chapter Meetup', 'success team Seminar Event', 'Available to Register', 'Pallavaram', 'BOSS Agro Hub Chapter Meetup', 250, 'Scheduled Program', ARRAY['05:30 PM'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  source = EXCLUDED.source,
  destination = EXCLUDED.destination,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  times = EXCLUDED.times;
