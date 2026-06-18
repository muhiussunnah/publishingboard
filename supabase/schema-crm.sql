-- ============================================================================
-- CRM feature pages — Supabase (Postgres) schema
-- ============================================================================
-- Generated from the source of the following Next.js client pages:
--   src/app/todo/page.js        -> todos
--   src/app/famevent/page.js    -> cities, links
--   src/app/stats/page.js       -> weekly_stats, category_stats, city_stats
--   src/app/files/page.js       -> files, folders
--   src/app/credentials/page.js -> credentials
--   src/app/videostats/page.js  -> video_projects  (+ storage bucket: images)
--
-- These pages read/write directly from the browser using the Supabase ANON
-- key, so every table is given a PERMISSIVE policy granting anon +
-- authenticated full access. This is intentional for an internal tool.
--
-- Run this whole file in the Supabase SQL editor. It is idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- todos  (src/app/todo/page.js)
--   .from('todos').select('*').order('due_date')
--   insert { title, assignee, due_date, priority, status }
--   update { status } / full form
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text,
  assignee text,
  due_date date,
  priority text default 'medium',
  status text default 'todo',
  created_at timestamptz default now()
);

-- cities  (src/app/famevent/page.js)
--   .from('cities').select('*').order('created_at')
--   insert { name, country }
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text,
  country text,
  created_at timestamptz default now()
);

-- links  (src/app/famevent/page.js)
--   .from('links').select('*')   (filtered client-side by city_id)
--   insert { city_id, title, url }   update { title, url }
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities (id) on delete cascade,
  title text,
  url text,
  created_at timestamptz default now()
);

-- weekly_stats  (src/app/stats/page.js)
--   .from('weekly_stats').select('*').order('id')
--   insert/update { week_label, events, smart_reach, sponsored,
--                   seasonal, affiliate, ugc, mini_articles }
--   Ordered by integer id and edited via numeric forms -> identity bigint.
create table if not exists public.weekly_stats (
  id bigint generated always as identity primary key,
  week_label text,
  events integer default 0,
  smart_reach integer default 0,
  sponsored integer default 0,
  seasonal integer default 0,
  affiliate integer default 0,
  ugc integer default 0,
  mini_articles integer default 0,
  created_at timestamptz default now()
);

-- category_stats  (src/app/stats/page.js)
--   .from('category_stats').select('*').order('id')
--   update { category, age_0_2 .. age_adult }
create table if not exists public.category_stats (
  id bigint generated always as identity primary key,
  category text,
  age_0_2 integer default 0,
  age_3_5 integer default 0,
  age_6_8 integer default 0,
  age_9_12 integer default 0,
  age_13_15 integer default 0,
  age_16_18 integer default 0,
  age_adult integer default 0,
  created_at timestamptz default now()
);

-- city_stats  (src/app/stats/page.js)
--   .from('city_stats').select('*')
--   .upsert({ city_name, events_count }, { onConflict: 'city_name' })
--   onConflict requires a unique constraint on city_name.
create table if not exists public.city_stats (
  id bigint generated always as identity primary key,
  city_name text unique,
  events_count integer default 0,
  created_at timestamptz default now()
);

-- files  (src/app/files/page.js)
--   .from('files').select('*').order('created_at')
--   insert/update { name, url, owner_email, category, folder_id }
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  name text,
  url text,
  owner_email text,
  category text default 'doc',
  folder_id uuid,
  created_at timestamptz default now()
);
-- (folder_id FK to public.folders is added after folders is created, below.)

-- folders  (src/app/files/page.js)
--   .from('folders').select('*').order('created_at')
--   insert { name }
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now()
);

-- credentials  (src/app/credentials/page.js)
--   .from('credentials').select('*').order('created_at')
--   insert/update { site_name, site_url, username, password, category }
create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  site_name text,
  site_url text,
  username text,
  password text,
  category text default 'general',
  created_at timestamptz default now()
);

-- video_projects  (src/app/videostats/page.js)
--   .from('video_projects').select('*').order('created_at')
--   insert/update { title, link, city, expiry_date, video_type,
--                   image_url, status, completed_at }
--   Hard reset uses .delete().neq('id', 0) (integer id) -> identity bigint.
--   (is_evergreen is a UI-only flag; it is NOT persisted.)
create table if not exists public.video_projects (
  id bigint generated always as identity primary key,
  title text,
  link text,
  city text,
  expiry_date date,
  video_type text default 'Event cards',
  image_url text,
  status text default 'selected',
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Foreign key for files.folder_id
-- (folders is created after files above; add the constraint now that both
--  tables exist, idempotently.)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'files_folder_id_fkey'
      and table_schema = 'public'
      and table_name = 'files'
  ) then
    alter table public.files
      add constraint files_folder_id_fkey
      foreign key (folder_id) references public.folders (id) on delete set null;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.todos enable row level security;
alter table public.cities enable row level security;
alter table public.links enable row level security;
alter table public.weekly_stats enable row level security;
alter table public.category_stats enable row level security;
alter table public.city_stats enable row level security;
alter table public.files enable row level security;
alter table public.folders enable row level security;
alter table public.credentials enable row level security;
alter table public.video_projects enable row level security;

-- ----------------------------------------------------------------------------
-- Permissive policies: anon + authenticated full access (internal tool)
-- ----------------------------------------------------------------------------
drop policy if exists "todos_all" on public.todos;
create policy "todos_all" on public.todos
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "cities_all" on public.cities;
create policy "cities_all" on public.cities
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "links_all" on public.links;
create policy "links_all" on public.links
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "weekly_stats_all" on public.weekly_stats;
create policy "weekly_stats_all" on public.weekly_stats
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "category_stats_all" on public.category_stats;
create policy "category_stats_all" on public.category_stats
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "city_stats_all" on public.city_stats;
create policy "city_stats_all" on public.city_stats
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "files_all" on public.files;
create policy "files_all" on public.files
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "folders_all" on public.folders;
create policy "folders_all" on public.folders
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "credentials_all" on public.credentials;
create policy "credentials_all" on public.credentials
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "video_projects_all" on public.video_projects;
create policy "video_projects_all" on public.video_projects
  for all to anon, authenticated using (true) with check (true);

-- ============================================================================
-- STORAGE BUCKETS — must be created manually in the Supabase dashboard
-- ============================================================================
-- The following Storage bucket is used by the app and is NOT created by this
-- SQL file. Create it under Storage in the Supabase dashboard:
--
--   * bucket name: images          (used by src/app/videostats/page.js
--                                    supabase.storage.from('images').upload()
--                                    and .getPublicUrl())
--       - set it to PUBLIC so getPublicUrl() returns viewable image links.
--
-- After creating the bucket, run the permissive storage policies below so the
-- browser (anon + authenticated) can upload and read objects in it.
-- Paste this into the Supabase SQL editor once the 'images' bucket exists:
--
--   drop policy if exists "images_read"   on storage.objects;
--   create policy "images_read"   on storage.objects
--     for select to anon, authenticated
--     using (bucket_id = 'images');
--
--   drop policy if exists "images_insert" on storage.objects;
--   create policy "images_insert" on storage.objects
--     for insert to anon, authenticated
--     with check (bucket_id = 'images');
--
--   drop policy if exists "images_update" on storage.objects;
--   create policy "images_update" on storage.objects
--     for update to anon, authenticated
--     using (bucket_id = 'images') with check (bucket_id = 'images');
--
--   drop policy if exists "images_delete" on storage.objects;
--   create policy "images_delete" on storage.objects
--     for delete to anon, authenticated
--     using (bucket_id = 'images');
-- ============================================================================
