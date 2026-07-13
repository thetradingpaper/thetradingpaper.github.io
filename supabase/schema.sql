-- ============================================================
-- The Trading Paper — Supabase schema (run ONCE in Supabase → SQL Editor)
-- Creates the "users list" (public.profiles), row-level security, and a
-- trigger that files every new signup as a REGULAR user (role = 'user').
-- Also backfills any account you already created (e.g. yours) into the list.
-- ============================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  handle       text unique,
  display_name text,
  role         text not null default 'user' check (role in ('user','admin')),
  created_at   timestamptz not null default now(),
  -- engagement state (drives streaks + "new since last visit")
  streak       int  not null default 0,
  best_streak  int  not null default 0,
  last_visit   date,
  seen_at      timestamptz
);

alter table public.profiles enable row level security;

-- A signed-in user may read and update only their own row.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Every new auth user automatically gets a profile row, as a REGULAR user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
          'user')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: file any EXISTING auth users (e.g. YOUR account, added via the
-- Supabase dashboard) into the users list as regular users. This is the
-- "migrate my existing account as a regular user" step — automatic.
insert into public.profiles (id, display_name, role)
select u.id,
       coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
       'user'
from auth.users u
on conflict (id) do nothing;

-- OPTIONAL — promote yourself to admin later (keeps you in the same list,
-- just flags the role). Replace the email:
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'YOU@EXAMPLE.COM');
