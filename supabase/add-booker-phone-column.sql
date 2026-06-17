-- ============================================================
-- Migration: Add booker_phone column to public.bookings
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booker_phone TEXT;

-- Done. Booker phone number column added successfully.
