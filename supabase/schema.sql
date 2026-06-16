-- ============================================================
-- success team Official Seminar and Leadership Portal Supabase Database Schema
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
  ('adm_1',       'admin',   'admin123',   'Super Admin',  'admin@successindia.test', '+91 9999988888', 'admin'),
  ('usr_mohamed', 'mohamed', 'mohamed123', 'Mohamed',     'mohamed@gmail.com',     '9944994778',     'user')
ON CONFLICT (id) DO NOTHING;

-- ── 6. SEED DATA — SEMINAR EVENTS ────────────────────────────
-- Seed data for active success team seminar events
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

-- ── 7. SAMPLE BOOKINGS ────────────────────────────────────────
-- ── 8. DONE ───────────────────────────────────────────────────
-- Schema setup complete! Your primary tables: users, events, bookings
-- All API routes will now use the Supabase client in src/lib/supabase.ts
