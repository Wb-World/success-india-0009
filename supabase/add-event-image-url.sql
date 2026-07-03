-- ============================================================
-- Add Event Banner Image URL Support and Storage Bucket
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Step 1: Add image_url column to the events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 2: Create a storage bucket for event banners if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Enable policy to allow public select access to the bucket
DROP POLICY IF EXISTS "Allow public read access to event-banners" ON storage.objects;
CREATE POLICY "Allow public read access to event-banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-banners');
