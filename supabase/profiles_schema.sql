-- ============================================================
-- PROFILES TABLE — linked to auth.users
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  full_name     text,
  email         text,
  avatar_url    text,
  phone         text,
  budget_range  text,                         -- e.g. '$500–$2k/mo'
  two_factor_enabled boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Row-level security
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- GOOGLE OAUTH SETUP (comments — no SQL needed)
-- ============================================================
-- 1. Supabase Dashboard → Authentication → Providers → Google
--    Enable Google, paste Client ID + Client Secret from Google Cloud Console
-- 2. Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs
--    Add Authorized Redirect URI:
--      https://<your-project-ref>.supabase.co/auth/v1/callback
-- 3. Supabase Dashboard → Authentication → URL Configuration
--    Site URL: https://botnetwork.io
--    Redirect URLs: https://botnetwork.io/auth/callback
--                   http://localhost:3000/auth/callback  (for local dev)
