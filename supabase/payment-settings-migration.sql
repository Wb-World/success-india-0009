-- Migration to create payment_settings table for success team seminar gateway settings:
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id               TEXT        PRIMARY KEY,
  upi_id           TEXT        NOT NULL,
  beneficiary_name TEXT        NOT NULL,
  qr_code_url      TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Allow full access to service_role (dashboard API backend)
CREATE POLICY "Allow service_role full access" ON public.payment_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Insert default configuration record
INSERT INTO public.payment_settings (id, upi_id, beneficiary_name, qr_code_url, updated_at)
VALUES (
  'service_config',
  'shesh.dav07-1@okaxis',
  'david',
  '/upi-qr-code.jpg?v=2',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
