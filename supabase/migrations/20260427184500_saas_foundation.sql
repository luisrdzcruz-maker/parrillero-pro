create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  avatar_url text,
  locale text not null default 'es',
  plan text not null default 'free',
  constraint profiles_plan_check check (plan in ('free', 'pro', 'admin'))
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;

create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;

create policy "Profiles are insertable by owner"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;

create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.saved_menus
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists is_public boolean not null default false,
  add column if not exists share_slug text,
  add column if not exists published_at timestamptz;

create unique index if not exists saved_menus_share_slug_key
  on public.saved_menus (share_slug)
  where share_slug is not null;

create index if not exists saved_menus_user_id_created_at_idx
  on public.saved_menus (user_id, created_at desc);

create index if not exists saved_menus_public_share_slug_idx
  on public.saved_menus (share_slug)
  where is_public = true;

drop policy if exists "Allow dev access to saved menus" on public.saved_menus;
drop policy if exists "Saved menus allow anonymous dev rows" on public.saved_menus;

create policy "Saved menus allow anonymous dev rows"
  on public.saved_menus
  for all
  using (user_id is null)
  with check (user_id is null);

drop policy if exists "Saved menus are manageable by owner" on public.saved_menus;

create policy "Saved menus are manageable by owner"
  on public.saved_menus
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Public saved menus are readable" on public.saved_menus;

create policy "Public saved menus are readable"
  on public.saved_menus
  for select
  using (is_public = true and share_slug is not null);

drop trigger if exists saved_menus_set_updated_at on public.saved_menus;

create trigger saved_menus_set_updated_at
  before update on public.saved_menus
  for each row
  execute function public.set_updated_at();

create table if not exists public.bbq_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  saved_menu_id uuid references public.saved_menus(id) on delete set null,
  title text not null,
  event_date date,
  guests integer,
  notes text
);

alter table public.bbq_events enable row level security;

drop policy if exists "BBQ events allow anonymous dev rows" on public.bbq_events;

create policy "BBQ events allow anonymous dev rows"
  on public.bbq_events
  for all
  using (user_id is null)
  with check (user_id is null);

drop policy if exists "BBQ events are manageable by owner" on public.bbq_events;

create policy "BBQ events are manageable by owner"
  on public.bbq_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists bbq_events_set_updated_at on public.bbq_events;

create trigger bbq_events_set_updated_at
  before update on public.bbq_events
  for each row
  execute function public.set_updated_at();

create table if not exists public.cooking_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  saved_menu_id uuid references public.saved_menus(id) on delete set null,
  bbq_event_id uuid references public.bbq_events(id) on delete set null,
  animal text,
  cut text,
  doneness text,
  thickness_cm numeric,
  equipment text,
  lang text not null default 'es',
  plan jsonb,
  steps jsonb,
  status text not null default 'generated',
  constraint cooking_sessions_status_check check (status in ('generated', 'saved', 'completed', 'failed'))
);

alter table public.cooking_sessions enable row level security;

drop policy if exists "Cooking sessions allow anonymous dev rows" on public.cooking_sessions;

create policy "Cooking sessions allow anonymous dev rows"
  on public.cooking_sessions
  for all
  using (user_id is null)
  with check (user_id is null);

drop policy if exists "Cooking sessions are manageable by owner" on public.cooking_sessions;

create policy "Cooking sessions are manageable by owner"
  on public.cooking_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists cooking_sessions_set_updated_at on public.cooking_sessions;

create trigger cooking_sessions_set_updated_at
  before update on public.cooking_sessions
  for each row
  execute function public.set_updated_at();

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  event_name text not null,
  source text not null default 'web',
  payload jsonb not null default '{}'::jsonb
);

alter table public.analytics_events enable row level security;

drop policy if exists "Analytics events are insertable anonymously" on public.analytics_events;

create policy "Analytics events are insertable anonymously"
  on public.analytics_events
  for insert
  with check (true);

drop policy if exists "Analytics events are viewable by owner" on public.analytics_events;

create policy "Analytics events are viewable by owner"
  on public.analytics_events
  for select
  using (auth.uid() = user_id);

create table if not exists public.qa_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null default 'admin_dashboard',
  total integer not null default 0,
  passed integer not null default 0,
  failed integer not null default 0,
  avg_score numeric,
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists qa_runs_created_at_idx
  on public.qa_runs (created_at desc);

create index if not exists qa_runs_user_id_created_at_idx
  on public.qa_runs (user_id, created_at desc);

alter table public.qa_runs enable row level security;

drop policy if exists "QA runs allow anonymous dev rows" on public.qa_runs;

create policy "QA runs allow anonymous dev rows"
  on public.qa_runs
  for all
  using (user_id is null)
  with check (user_id is null);

drop policy if exists "QA runs are manageable by owner" on public.qa_runs;

create policy "QA runs are manageable by owner"
  on public.qa_runs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.qa_failures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  qa_run_id uuid not null references public.qa_runs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  animal text,
  cut text,
  doneness text,
  thickness numeric,
  equipment text,
  error text not null,
  score numeric,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists qa_failures_qa_run_id_idx
  on public.qa_failures (qa_run_id);

create index if not exists qa_failures_user_id_created_at_idx
  on public.qa_failures (user_id, created_at desc);

alter table public.qa_failures enable row level security;

drop policy if exists "QA failures allow anonymous dev rows" on public.qa_failures;

create policy "QA failures allow anonymous dev rows"
  on public.qa_failures
  for all
  using (user_id is null)
  with check (user_id is null);

drop policy if exists "QA failures are manageable by owner" on public.qa_failures;

create policy "QA failures are manageable by owner"
  on public.qa_failures
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
