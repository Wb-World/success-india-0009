-- ============================================================
-- SQL Migration: Replace 'username' with 'member_id'
-- Execute this script in your Supabase SQL Editor.
-- ============================================================

-- 1. Ensure 'email' column exists safely before altering constraints
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Rename column 'username' to 'member_id' if 'username' exists and 'member_id' does not
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'member_id'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN username TO member_id;
  END IF;
END $$;

-- 3. If member_id column still does not exist, create it
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS member_id TEXT;

-- 4. If both username and member_id exist, populate member_id from username and drop username
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'member_id'
  ) THEN
    UPDATE public.users SET member_id = username WHERE member_id IS NULL OR member_id = '';
    ALTER TABLE public.users DROP COLUMN username;
  END IF;
END $$;

-- 5. Fill any remaining null member_id values with id
UPDATE public.users SET member_id = id WHERE member_id IS NULL OR member_id = '';

-- 6. Set member_id as NOT NULL
ALTER TABLE public.users ALTER COLUMN member_id SET NOT NULL;

-- 7. Drop NOT NULL constraint on email column safely
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 8. Drop legacy indexes if present
DROP INDEX IF EXISTS public.idx_users_username;
DROP INDEX IF EXISTS public.idx_users_membership_id;

-- 9. Create unique index on member_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_member_id ON public.users (member_id);
