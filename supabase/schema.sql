-- ============================================================
-- GreenWheels Bus Ticket Booking — Supabase Database Schema
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

-- Buses table
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

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id          TEXT        PRIMARY KEY DEFAULT 'bk_' || extract(epoch from now())::bigint::text,
  user_id     TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bus_id      TEXT        NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  bus_name    TEXT        NOT NULL,
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

-- ── 3. INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_user_id   ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bus_id    ON public.bookings(bus_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date      ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_buses_source_dest  ON public.buses(source, destination);

-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Because we use the service_role key in our Next.js API routes,
-- the server bypasses RLS entirely. We set permissive policies
-- for the anon key (used on the client side — read-only buses).

-- Buses: anyone can read (for the landing page search widget)
CREATE POLICY "buses_public_read"
  ON public.buses FOR SELECT
  USING (true);

-- Users: only service_role (server) can touch — no anon policies needed
-- Bookings: only service_role (server) can touch — no anon policies needed

-- ── 5. SEED DATA — USERS ─────────────────────────────────────
INSERT INTO public.users (id, username, password, name, email, phone, role) VALUES
  ('usr_1',       'user',    'password',   'Alex Mercer', 'alex.mercer@gmail.com', '+91 9876543210', 'user'),
  ('adm_1',       'admin',   'admin123',   'Super Admin',  'admin@greenwheels.in', '+91 9999988888', 'admin'),
  ('usr_mohamed', 'mohamed', 'mohamed123', 'Mohamed',     'mohamed@gmail.com',     '9944994778',     'user')
ON CONFLICT (id) DO NOTHING;

-- ── 6. SEED DATA — BUSES ─────────────────────────────────────
INSERT INTO public.buses (id, name, type, source, destination, price, duration, times) VALUES
  ('seminar_501', 'Success India Member Growth Orientation', 'Leadership Chapter Orientation', 'Chromepet, Chennai', 'Leadership Development Seminars', 0, '1h 30m', ARRAY['09:30 AM','06:00 PM']),
  ('bus_101', 'Karnataka Vaibhav',   'AC Luxury Sleeper (2+2)',        'Bangalore', 'Chennai',   950,  '6h 30m', ARRAY['08:00 AM','02:00 PM','09:30 PM','11:00 PM']),
  ('bus_102', 'Cauvery Travels',     'AC Premium Seater (2+2)',        'Chennai',   'Bangalore', 750,  '6h 15m', ARRAY['07:30 AM','01:00 PM','06:00 PM','10:30 PM']),
  ('bus_103', 'Deccan Express',      'AC Luxury Sleeper (2+1)',        'Mumbai',    'Pune',      650,  '3h 45m', ARRAY['06:00 AM','11:30 AM','04:30 PM','09:00 PM']),
  ('bus_104', 'Western Ghats Glider','Non-AC Economy Seater (2+2)',    'Pune',      'Mumbai',    350,  '3h 30m', ARRAY['08:00 AM','02:00 PM','07:00 PM']),
  ('bus_105', 'Rajdhani Connect',    'AC Multi-Axle Sleeper (2+1)',    'Delhi',     'Jaipur',    1250, '5h 30m', ARRAY['07:00 AM','01:30 PM','09:00 PM','11:30 PM']),
  ('bus_106', 'Pink City Express',   'AC Seater (2+2)',                'Jaipur',    'Delhi',     850,  '5h 15m', ARRAY['06:30 AM','12:00 PM','05:30 PM','10:00 PM']),
  ('bus_107', 'Nizams Cruiser',      'AC Premium Sleeper (2+1)',       'Hyderabad', 'Bangalore', 1450, '8h 45m', ARRAY['08:30 PM','10:00 PM','11:15 PM']),
  ('bus_108', 'Garden City Link',    'AC Luxury Seater (2+2)',         'Bangalore', 'Hyderabad', 1100, '8h 30m', ARRAY['09:00 AM','03:00 PM','09:30 PM']),
  ('bus_109', 'Coromandel Express',  'AC Sleeper (2+2)',               'Chennai',   'Hyderabad', 1350, '10h 00m',ARRAY['07:00 PM','08:30 PM','10:00 PM']),
  ('bus_110', 'Charminar Shuttle',   'AC Seater (2+2)',                'Hyderabad', 'Chennai',   900,  '9h 30m', ARRAY['08:00 AM','02:30 PM','09:00 PM']),
  ('bus_111', 'Golden Temple Liner', 'AC Multi-Axle Sleeper (2+2)',    'Delhi',     'Amritsar',  1100, '7h 00m', ARRAY['07:00 AM','09:00 PM','11:00 PM']),
  ('bus_112', 'Konkan Cruiser',      'AC Luxury Sleeper (2+1)',        'Mumbai',    'Goa',       1300, '9h 00m', ARRAY['06:00 PM','08:00 PM','10:00 PM']),
  ('bus_113', 'East Coast Express',  'AC Premium Seater (2+2)',        'Hyderabad', 'Chennai',   800,  '9h 00m', ARRAY['06:00 AM','06:00 PM']),
  ('bus_114', 'Vindhya Volvo',       'AC Multi-Axle Seater (2+2)',     'Delhi',     'Mumbai',    1800, '16h 00m',ARRAY['03:00 PM','06:00 PM']),
  ('bus_115', 'Mysore Palace Liner', 'AC Luxury Sleeper (2+2)',        'Bangalore', 'Mysore',    250,  '3h 00m', ARRAY['06:00 AM','09:00 AM','12:00 PM','03:00 PM','06:00 PM','09:00 PM'])
ON CONFLICT (id) DO NOTHING;

-- ── 7. SEED DATA — SAMPLE BOOKINGS ───────────────────────────
INSERT INTO public.bookings (id, user_id, bus_id, bus_name, source, destination, date, time, seats, total_price, screenshot, status, created_at) VALUES
  ('bk_1', 'usr_1', 'bus_101', 'Karnataka Vaibhav', 'Bangalore', 'Chennai', '2026-06-20', '08:00 AM',
   ARRAY['A1','A2'], 1900,
   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
   'approved', '2026-06-12T14:32:00.000Z'),
  ('bk_2', 'usr_mohamed', 'bus_102', 'Cauvery Travels', 'Chennai', 'Bangalore', '2026-06-15', '07:30 AM',
   ARRAY['C3'], 750,
   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
   'pending', '2026-06-13T08:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ── 8. DONE ───────────────────────────────────────────────────
-- Schema setup complete! Your tables: users, buses, bookings
-- All API routes will now use the Supabase client in src/lib/supabase.ts
