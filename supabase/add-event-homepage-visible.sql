-- ============================================================
-- Migration: Add homepage_visible column to public.events
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS homepage_visible BOOLEAN DEFAULT TRUE;

-- Update existing events to be visible on the homepage by default
UPDATE public.events
SET homepage_visible = TRUE
WHERE homepage_visible IS NULL;
