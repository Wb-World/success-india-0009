-- Migration: Add user_email and username columns to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT;
