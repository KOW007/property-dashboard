-- ACH Cron Setup
-- Run in Supabase SQL Editor

-- 1. Add authorization fields to tenant_bank_info
ALTER TABLE public.tenant_bank_info
  ADD COLUMN IF NOT EXISTS ach_authorized_at  timestamptz,
  ADD COLUMN IF NOT EXISTS ach_authorization_ip text,
  ADD COLUMN IF NOT EXISTS ach_authorization_text text;

-- 2. ACH batch audit log — one row per daily cron run
CREATE TABLE IF NOT EXISTS public.ach_batches (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  run_date         date NOT NULL,
  payment_days     int[] NOT NULL,          -- which payment_day values were included
  entry_count      int NOT NULL DEFAULT 0,
  total_cents      bigint NOT NULL DEFAULT 0,
  file_name        text,
  status           text NOT NULL DEFAULT 'generated', -- generated | sent | failed
  error_message    text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ach_batches_run_date_idx ON public.ach_batches (run_date DESC);

-- RLS: server-only via service role, no direct client access
ALTER TABLE public.ach_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_bank_info ENABLE ROW LEVEL SECURITY;

-- Tenants can read/write their own bank info only
CREATE POLICY IF NOT EXISTS "Tenants can manage their own bank info"
  ON public.tenant_bank_info
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE auth_user_id = auth.uid()
    )
  );
