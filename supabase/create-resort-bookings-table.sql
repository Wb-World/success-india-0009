-- Create resort_bookings table with user_id reference and status defaulting to PENDING VERIFICATION
CREATE TABLE IF NOT EXISTS public.resort_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  guests INTEGER NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  accommodation_type TEXT NOT NULL,
  special_notes TEXT,
  amount NUMERIC NOT NULL,
  utr_number TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING VERIFICATION' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already exists, we can apply columns update dynamically:
ALTER TABLE public.resort_bookings ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.resort_bookings ALTER COLUMN status SET DEFAULT 'PENDING VERIFICATION';

-- Enable Row Level Security
ALTER TABLE public.resort_bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert bookings
DROP POLICY IF EXISTS "Allow public inserts" ON public.resort_bookings;
CREATE POLICY "Allow public inserts" ON public.resort_bookings
  FOR INSERT
  WITH CHECK (true);

-- Create policy for users to view own resort bookings
DROP POLICY IF EXISTS "Allow users to view own resort bookings" ON public.resort_bookings;
CREATE POLICY "Allow users to view own resort bookings" ON public.resort_bookings
  FOR SELECT
  USING (true);
