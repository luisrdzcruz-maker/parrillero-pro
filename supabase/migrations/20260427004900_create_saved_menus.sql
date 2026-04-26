create extension if not exists pgcrypto;

create table if not exists public.saved_menus (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  lang text not null,
  people integer,
  data jsonb not null
);

alter table public.saved_menus enable row level security;

create policy "Allow dev access to saved menus"
  on public.saved_menus
  as permissive
  for all
  using (true)
  with check (true);
