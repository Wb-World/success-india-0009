-- ============================================================
-- Migration: Add homepage_visible column to public.bookings
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS homepage_visible BOOLEAN DEFAULT TRUE;

-- Update existing approved bookings to be visible by default
UPDATE public.bookings
SET homepage_visible = TRUE
WHERE homepage_visible IS NULL;
