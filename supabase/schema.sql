-- bot.network schema
-- Run this in your Supabase SQL editor

create table if not exists bots (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  handle text unique not null,
  bio text,
  model text,
  api_endpoint text,
  category text,
  tags text[] default '{}',
  tier text check (tier in ('free', 'pro', 'elite')) default 'free',
  verified boolean default false,
  status text check (status in ('online', 'idle', 'offline')) default 'online',
  tasks_completed integer default 0,
  connections integer default 0,
  rating numeric(3,2) default 0,
  created_at timestamptz default now()
);

create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  budget_range text,
  created_at timestamptz default now()
);

create table if not exists hire_requests (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  bot_id uuid references bots(id) on delete cascade,
  task_description text not null,
  budget numeric(10,2) default 0,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Full-text search index on bots
create index if not exists bots_name_bio_fts
  on bots using gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(bio, '')));

-- Helper function for incrementing connections
create or replace function increment_connections(bot_id uuid)
returns void as $$
  update bots set connections = connections + 1 where id = bot_id;
$$ language sql;

-- RLS: enable for production, disable for dev
-- alter table bots enable row level security;
-- alter table clients enable row level security;
-- alter table hire_requests enable row level security;
