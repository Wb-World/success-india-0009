-- ============================================================
-- success team Official Event and Leadership Portal Supabase Database Schema
-- Run this entire file in your Supabase SQL Editor once.
-- Project: raypwndyjclstbqxrahm
-- ============================================================

-- ── 1. EXTENSIONS ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. TABLES ────────────────────────────────────────────────

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id          TEXT        PRIMARY KEY DEFAULT 'usr_' || gen_random_uuid()::text,
  username    TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  phone       TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legacy compatibility seminar lookup table.
-- New event creation uses public.events. This table is retained only so older
-- bookings columns and deployed data can continue to resolve seminar records.
CREATE TABLE IF NOT EXISTS public.buses (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'Available to Register',
  source      TEXT        NOT NULL,
  destination TEXT        NOT NULL,
  price       INTEGER     NOT NULL,
  duration    TEXT        NOT NULL,
  times       TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.buses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Available to Register';

-- success team seminar events table
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

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id          TEXT        PRIMARY KEY DEFAULT 'bk_' || extract(epoch from now())::bigint::text,
  user_id     TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seminar_id  TEXT,
  seminar_name TEXT,
  bus_id      TEXT,
  bus_name    TEXT,
  source      TEXT        NOT NULL,
  destination TEXT        NOT NULL,
  date        TEXT        NOT NULL,
  time        TEXT        NOT NULL,
  seats       TEXT[]      NOT NULL DEFAULT '{}',
  total_price INTEGER     NOT NULL,
  screenshot  TEXT        NOT NULL,  -- base64 encoded payment screenshot
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration for success team seminar bookings:
-- remove the legacy FK to public.buses so seminar IDs can be stored as plain text.
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_bus_id_fkey;

ALTER TABLE public.bookings
  ALTER COLUMN bus_id DROP NOT NULL,
  ALTER COLUMN bus_name DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS seminar_id TEXT,
  ADD COLUMN IF NOT EXISTS seminar_name TEXT;

-- ── 3. INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_user_id   ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bus_id    ON public.bookings(bus_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seminar_id ON public.bookings(seminar_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date      ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_buses_source_dest  ON public.buses(source, destination);
CREATE INDEX IF NOT EXISTS idx_events_datetime    ON public.events(event_datetime);
CREATE INDEX IF NOT EXISTS idx_events_status      ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_venue_title ON public.events(venue, title);

-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events   ENABLE ROW LEVEL SECURITY;

-- Because we use the service_role key in our Next.js API routes,
-- the server bypasses RLS entirely. We set permissive policies
-- for the anon key. Public seminar records are read through public.events.

-- Legacy compatibility rows can be read by older clients.
CREATE POLICY "buses_public_read"
  ON public.buses FOR SELECT
  USING (true);

CREATE POLICY "events_public_read"
  ON public.events FOR SELECT
  USING (status = 'active');

-- Users: only service_role (server) can touch — no anon policies needed
-- Bookings: only service_role (server) can touch — no anon policies needed

-- ── 5. SEED DATA — USERS ─────────────────────────────────────
INSERT INTO public.users (id, username, password, name, email, phone, role) VALUES
  ('usr_1',       'user',    'password',   'Alex Mercer', 'alex.mercer@gmail.com', '+91 9876543210', 'user'),
  ('adm_1',       'admin',   'admin123',   'Super Admin',  'admin@team.test', '+91 9999988888', 'admin'),
  ('usr_mohamed', 'mohamed', 'mohamed123', 'Mohamed',     'mohamed@gmail.com',     '9944994778',     'user')
ON CONFLICT (id) DO NOTHING;

-- ── 6. SEED DATA — SEMINAR EVENTS ────────────────────────────
-- Seed data for active success team seminar events
INSERT INTO public.events (id, title, venue, event_datetime, price, total_seats, status) VALUES
  ('seminar_101', 'success team Leadership Development Event', 'Chromepet, Chennai', '2026-06-21T10:00:00+05:30', 250, 60, 'active'),
  ('seminar_102', 'Weekly Income Strategy Session', 'Tambaram', '2026-06-22T18:00:00+05:30', 250, 60, 'active'),
  ('seminar_103', 'BOSS Agro Hub Chapter Meetup', 'Pallavaram', '2026-06-23T17:30:00+05:30', 250, 60, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.buses (id, name, type, status, source, destination, price, duration, times) VALUES
  ('seminar_101', 'success team Leadership Development Event', 'success team Event Event', 'Available to Register', 'Chromepet, Chennai', 'success team Leadership Development Event', 250, 'Scheduled Program', ARRAY['10:00 AM']),
  ('seminar_102', 'Weekly Income Strategy Session', 'success team Event Event', 'Available to Register', 'Tambaram', 'Weekly Income Strategy Session', 250, 'Scheduled Program', ARRAY['06:00 PM']),
  ('seminar_103', 'BOSS Agro Hub Chapter Meetup', 'success team Event Event', 'Available to Register', 'Pallavaram', 'BOSS Agro Hub Chapter Meetup', 250, 'Scheduled Program', ARRAY['05:30 PM'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  source = EXCLUDED.source,
  destination = EXCLUDED.destination,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  times = EXCLUDED.times;

-- ── 7. SAMPLE BOOKINGS ────────────────────────────────────────
-- ── 8. DONE ───────────────────────────────────────────────────
-- Schema setup complete! Your primary tables: users, events, bookings
-- All API routes will now use the Supabase client in src/lib/supabase.ts
-- Migration to update bookings schema for success team Official Event and Leadership Portal
-- Run this in your Supabase SQL Editor to support detailed attendee details and QR payloads.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS attendee_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS qr_code_payload TEXT DEFAULT '';

-- Add index on attendee_details for faster querying if needed
CREATE INDEX IF NOT EXISTS idx_bookings_attendee_details ON public.bookings USING gin (attendee_details);
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

-- Migration to create payment_settings table for success team seminar gateway settings:
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id               TEXT        PRIMARY KEY,
  upi_id           TEXT        NOT NULL,
  beneficiary_name TEXT        NOT NULL,
  qr_code_url      TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Allow full access to service_role (dashboard API backend)
CREATE POLICY "Allow service_role full access" ON public.payment_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Insert default configuration record
INSERT INTO public.payment_settings (id, upi_id, beneficiary_name, qr_code_url, updated_at)
VALUES (
  'service_config',
  'shesh.dav07-1@okaxis',
  'david',
  '/upi-qr-code.jpg?v=2',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
-- ============================================================
-- success team Payment Verification Migration
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Create configs table for admin options
CREATE TABLE IF NOT EXISTS public.configs (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Enable RLS on configs
ALTER TABLE public.configs ENABLE ROW LEVEL SECURITY;

-- Permissive policies for configs
CREATE POLICY "configs_public_read"
  ON public.configs FOR SELECT
  USING (true);

-- Seed default settings
INSERT INTO public.configs (key, value) VALUES
  ('upi_id', 'shesh.dav07-1@okaxis'),
  ('upi_name', 'david'),
  ('upi_qr_url', '')
ON CONFLICT (key) DO NOTHING;

-- Create payment_proofs table
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id                  TEXT        PRIMARY KEY DEFAULT 'proof_' || extract(epoch from now())::bigint::text || '_' || floor(random()*1000)::text,
  booking_id          TEXT        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  screenshot_path     TEXT        NOT NULL,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT        NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS on payment_proofs
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Permissive select policy for admin audits
CREATE POLICY "payment_proofs_public_read"
  ON public.payment_proofs FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_proofs_booking_id ON public.payment_proofs(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON public.payment_proofs(verification_status);
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
  ('seminar_101', 'success team Leadership Development Event', 'Chromepet, Chennai', '2026-06-21T10:00:00+05:30', 250, 60, 'active'),
  ('seminar_102', 'Weekly Income Strategy Session', 'Tambaram', '2026-06-22T18:00:00+05:30', 250, 60, 'active'),
  ('seminar_103', 'BOSS Agro Hub Chapter Meetup', 'Pallavaram', '2026-06-23T17:30:00+05:30', 250, 60, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.buses (id, name, type, status, source, destination, price, duration, times) VALUES
  ('seminar_101', 'success team Leadership Development Event', 'success team Event Event', 'Available to Register', 'Chromepet, Chennai', 'success team Leadership Development Event', 250, 'Scheduled Program', ARRAY['10:00 AM']),
  ('seminar_102', 'Weekly Income Strategy Session', 'success team Event Event', 'Available to Register', 'Tambaram', 'Weekly Income Strategy Session', 250, 'Scheduled Program', ARRAY['06:00 PM']),
  ('seminar_103', 'BOSS Agro Hub Chapter Meetup', 'success team Event Event', 'Available to Register', 'Pallavaram', 'BOSS Agro Hub Chapter Meetup', 250, 'Scheduled Program', ARRAY['05:30 PM'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  source = EXCLUDED.source,
  destination = EXCLUDED.destination,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  times = EXCLUDED.times;
