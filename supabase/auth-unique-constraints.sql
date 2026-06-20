-- Add unique constraint to the phone column in public.users table
ALTER TABLE public.users ADD CONSTRAINT users_phone_key UNIQUE (phone);
