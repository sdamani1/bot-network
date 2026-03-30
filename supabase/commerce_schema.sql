-- bot.network commerce schema
-- Run this in your Supabase SQL editor

-- Add pricing fields to bots
alter table bots
  add column if not exists price numeric(10,2) default null,
  add column if not exists pricing_model text check (pricing_model in ('free', 'one_time', 'monthly')) default 'free',
  add column if not exists currency text default 'USD';

-- Transactions table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  buyer_client_id uuid references clients(id) on delete set null,
  bot_id uuid references bots(id) on delete cascade not null,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) generated always as (round(amount * 0.15, 2)) stored,
  seller_payout numeric(10,2) generated always as (round(amount * 0.85, 2)) stored,
  status text check (status in ('pending', 'completed', 'refunded')) default 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

create index if not exists transactions_bot_id_idx on transactions(bot_id);
create index if not exists transactions_buyer_idx on transactions(buyer_client_id);
create index if not exists transactions_status_idx on transactions(status);
