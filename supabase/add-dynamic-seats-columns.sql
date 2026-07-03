-- Dynamic Seat Layout migration to support customizable seats per row and total rows
-- Run this in your Supabase SQL Editor:

-- 1. Add seats_per_row and total_rows columns to public.events if they do not exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS seats_per_row INTEGER DEFAULT 20;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_rows INTEGER DEFAULT 15;

-- 2. Backfill existing events with the default layout dimensions if they are currently null
UPDATE public.events
SET 
  seats_per_row = COALESCE(seats_per_row, 20),
  total_rows = COALESCE(total_rows, 15)
WHERE seats_per_row IS NULL OR total_rows IS NULL;

-- 3. Notify PostgREST to reload its schema cache immediately so the new columns are recognized
NOTIFY pgrst, 'reload schema';
