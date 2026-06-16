-- Migration to update bookings schema for success team Official Event and Leadership Portal
-- Run this in your Supabase SQL Editor to support detailed attendee details and QR payloads.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS attendee_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS qr_code_payload TEXT DEFAULT '';

-- Add index on attendee_details for faster querying if needed
CREATE INDEX IF NOT EXISTS idx_bookings_attendee_details ON public.bookings USING gin (attendee_details);
