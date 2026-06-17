-- ============================================================
-- Migration: Remove mandatory user auth from bookings
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Drop the FK constraint so user_id no longer must reference users table
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

-- 2. Make user_id nullable (no longer required)
ALTER TABLE public.bookings
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add booker identity columns (name + 6-char member ID)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booker_name       TEXT,
  ADD COLUMN IF NOT EXISTS booker_member_id  TEXT;

-- 4. Index for booker lookups
CREATE INDEX IF NOT EXISTS idx_bookings_booker_member_id ON public.bookings(booker_member_id);

-- Done. Bookings can now be made without a registered user account.
