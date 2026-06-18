-- ============================================================
-- Migration: Add whatsapp_sent column to public.bookings
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT FALSE;

-- Done. whatsapp_sent column added successfully.
