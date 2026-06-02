-- ============================================================================
--  Famies Publiceringsbord — Supabase schema
--  Run this in the Supabase SQL editor, then run seed.sql (optional demo data).
--  The app uses a pragmatic "document" model: each row = { id, data jsonb }.
--  Writes happen server-side with the service-role key, so RLS stays locked.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '[]'
);

-- Lock down with RLS. The server uses the service-role key which bypasses RLS,
-- so no public policies are needed. Anonymous clients get nothing.
alter table public.customers enable row level security;
alter table public.items     enable row level security;
alter table public.videos    enable row level security;
alter table public.leads     enable row level security;
alter table public.settings  enable row level security;

-- Optional: index for ordering
create index if not exists customers_created_idx on public.customers (created_at);
create index if not exists items_created_idx     on public.items (created_at);
create index if not exists videos_created_idx    on public.videos (created_at);
create index if not exists leads_created_idx      on public.leads (created_at);
