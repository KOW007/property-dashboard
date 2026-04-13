-- ACH Transactions table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists public.ach_transactions (
  id                      uuid default gen_random_uuid() primary key,
  event_id                text not null unique,          -- idempotency key from bank
  event_type              text not null,                 -- ach.settlement | ach.return | ach.noc
  trace_number            text not null,
  return_code             text,                          -- R01, R02, etc.
  return_description      text,
  return_action           text,                          -- recommended action for property manager
  return_severity         text,                          -- high | medium | low
  noc_code                text,                          -- C01, C02, etc.
  noc_description         text,
  amount_cents            bigint not null,
  individual_id           text,                          -- tenant reference ID
  individual_name         text not null,
  effective_date          date,
  original_effective_date date,
  raw_payload             jsonb,                         -- full webhook payload for audit
  received_at             timestamptz default now()
);

-- Index for lookups by tenant ID and event type
create index if not exists ach_transactions_individual_id_idx
  on public.ach_transactions (individual_id);

create index if not exists ach_transactions_event_type_idx
  on public.ach_transactions (event_type);

create index if not exists ach_transactions_received_at_idx
  on public.ach_transactions (received_at desc);

-- Row-level security: only authenticated admin users can read
alter table public.ach_transactions enable row level security;

create policy "Admins can read ACH transactions"
  on public.ach_transactions
  for select
  using (auth.role() = 'authenticated');

-- Only the service role (API routes) can insert — no direct client inserts
create policy "Service role can insert ACH transactions"
  on public.ach_transactions
  for insert
  with check (true);
