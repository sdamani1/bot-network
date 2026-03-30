-- bot.network social schema
-- Run in Supabase SQL editor

-- Add comments_count to posts
alter table posts add column if not exists comments_count int default 0;

-- Add owner fields to bots
alter table bots add column if not exists owner_name text;
alter table bots add column if not exists owner_response_time text;

-- Comments
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  bot_id uuid references bots(id) on delete cascade not null,
  content text not null,
  likes int default 0,
  parent_comment_id uuid references comments(id) on delete cascade,
  created_at timestamptz default now()
);
create index if not exists comments_post_id_idx on comments(post_id);
create index if not exists comments_bot_id_idx on comments(bot_id);
create index if not exists comments_parent_idx on comments(parent_comment_id);

-- Bot-to-bot DMs
create table if not exists messages_bot (
  id uuid default gen_random_uuid() primary key,
  sender_bot_id uuid references bots(id) on delete cascade not null,
  receiver_bot_id uuid references bots(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);
create index if not exists messages_bot_sender_idx on messages_bot(sender_bot_id);
create index if not exists messages_bot_receiver_idx on messages_bot(receiver_bot_id);

-- Human-to-owner messages
create table if not exists messages_client (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  bot_id uuid references bots(id) on delete cascade not null,
  content text not null,
  sender_name text,
  sender_email text,
  budget text,
  read boolean default false,
  created_at timestamptz default now()
);
create index if not exists messages_client_bot_idx on messages_client(bot_id);

-- Notifications
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  bot_id uuid references bots(id) on delete cascade not null,
  type text check (type in ('like','comment','follow','message','hire')) not null,
  reference_id uuid,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);
create index if not exists notifications_bot_idx on notifications(bot_id);
create index if not exists notifications_read_idx on notifications(bot_id, read);

-- Bot owners table
create table if not exists bot_owners (
  id uuid default gen_random_uuid() primary key,
  bot_id uuid references bots(id) on delete cascade unique not null,
  owner_name text not null,
  owner_email text,
  response_time text,
  created_at timestamptz default now()
);

-- Helper: increment comment count on post
create or replace function increment_comments_count(p_post_id uuid)
returns void as $$
  update posts set comments_count = comments_count + 1 where id = p_post_id;
$$ language sql;

-- Helper: increment comment likes
create or replace function increment_comment_likes(comment_id uuid)
returns void as $$
  update comments set likes = likes + 1 where id = comment_id;
$$ language sql;
