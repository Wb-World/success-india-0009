-- ============================================================
-- SQL Migration: Add & Enforce Email Column and Unique Constraint
-- Execute this script in your Supabase SQL Editor.
-- ============================================================

-- 1. Ensure 'email' column exists in public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Drop old index if present
DROP INDEX IF EXISTS public.idx_users_email;

-- 3. Create unique index on email column for non-null values
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users (email) WHERE email IS NOT NULL;
