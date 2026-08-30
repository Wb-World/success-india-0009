-- ============================================================
-- SQL Migration: Add Membership ID Column & Support Gmail OTP
-- Execute this script in your Supabase SQL Editor.
-- ============================================================

-- 1. Add membership_id column to public.users table if not already present
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS membership_id TEXT;

-- 2. Make email column optional / nullable for users registering without email
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 3. Synchronize existing users so membership_id matches username
UPDATE public.users 
SET membership_id = username 
WHERE membership_id IS NULL OR membership_id = '';

-- 4. Create unique index on membership_id for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_membership_id ON public.users (membership_id);
