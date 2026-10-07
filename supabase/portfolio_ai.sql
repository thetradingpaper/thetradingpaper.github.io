-- ============================================================
-- Portfolio AI — one row per user with their whole portfolio (jsonb).
-- Run once in Supabase → SQL Editor. Then put the Project URL and the
-- anon public key into app/pai-config.js (supabaseUrl / supabaseAnonKey).
-- Row Level Security: every user can read/write ONLY their own row.
-- ============================================================
create table if not exists public.pai_portfolios (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.pai_portfolios enable row level security;

drop policy if exists "pai own select" on public.pai_portfolios;
drop policy if exists "pai own insert" on public.pai_portfolios;
drop policy if exists "pai own update" on public.pai_portfolios;
drop policy if exists "pai own delete" on public.pai_portfolios;
create policy "pai own select" on public.pai_portfolios for select using (auth.uid() = user_id);
create policy "pai own insert" on public.pai_portfolios for insert with check (auth.uid() = user_id);
create policy "pai own update" on public.pai_portfolios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pai own delete" on public.pai_portfolios for delete using (auth.uid() = user_id);

-- Optional: subscription status (filled later by the payment webhook)
alter table public.pai_portfolios add column if not exists plan text not null default 'free';
alter table public.pai_portfolios add column if not exists paid_until date;

-- Users may write only their data, never their own plan / paid_until
revoke insert, update on public.pai_portfolios from anon, authenticated;
grant insert (user_id, data, updated_at) on public.pai_portfolios to authenticated;
grant update (data, updated_at) on public.pai_portfolios to authenticated;
grant select, delete on public.pai_portfolios to authenticated;
