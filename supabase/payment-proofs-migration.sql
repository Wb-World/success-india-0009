-- ============================================================
-- success team Payment Verification Migration
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Create configs table for admin options
CREATE TABLE IF NOT EXISTS public.configs (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Enable RLS on configs
ALTER TABLE public.configs ENABLE ROW LEVEL SECURITY;

-- Permissive policies for configs
CREATE POLICY "configs_public_read"
  ON public.configs FOR SELECT
  USING (true);

-- Seed default settings
INSERT INTO public.configs (key, value) VALUES
  ('upi_id', 'shesh.dav07-1@okaxis'),
  ('upi_name', 'david'),
  ('upi_qr_url', '')
ON CONFLICT (key) DO NOTHING;

-- Create payment_proofs table
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id                  TEXT        PRIMARY KEY DEFAULT 'proof_' || extract(epoch from now())::bigint::text || '_' || floor(random()*1000)::text,
  booking_id          TEXT        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  screenshot_path     TEXT        NOT NULL,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT        NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS on payment_proofs
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Permissive select policy for admin audits
CREATE POLICY "payment_proofs_public_read"
  ON public.payment_proofs FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_proofs_booking_id ON public.payment_proofs(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON public.payment_proofs(verification_status);
