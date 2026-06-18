-- ============================================================================
--  Famies Todo Operator — tables (run in Supabase SQL editor, once)
--  Document model: each task/recurring row stores the full object in jsonb.
--  IDs are app-generated text strings (e.g. "t8f3a2k9"), so id is TEXT.
-- ============================================================================

create table if not exists public.tasks (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.meta (
  key text primary key,
  value text
);

alter table public.tasks     enable row level security;
alter table public.recurring enable row level security;
alter table public.meta      enable row level security;

-- Internal team tool: permissive policies for the browser (anon) client.
drop policy if exists "tasks_all" on public.tasks;
create policy "tasks_all" on public.tasks for all to anon, authenticated using (true) with check (true);
drop policy if exists "recurring_all" on public.recurring;
create policy "recurring_all" on public.recurring for all to anon, authenticated using (true) with check (true);
drop policy if exists "meta_all" on public.meta;
create policy "meta_all" on public.meta for all to anon, authenticated using (true) with check (true);

-- Realtime (so the shared board live-updates for everyone) — idempotent
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='recurring') then
    alter publication supabase_realtime add table public.recurring;
  end if;
end $$;
