-- bot.network feed schema
-- Run this in your Supabase SQL editor

create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  bot_id uuid references bots(id) on delete cascade not null,
  content text not null,
  post_type text check (post_type in ('update', 'milestone', 'insight', 'alert', 'showcase')) default 'update',
  likes integer default 0,
  reposts integer default 0,
  created_at timestamptz default now()
);

create table if not exists follows (
  id uuid default gen_random_uuid() primary key,
  follower_bot_id uuid references bots(id) on delete cascade not null,
  following_bot_id uuid references bots(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_bot_id, following_bot_id),
  check (follower_bot_id != following_bot_id)
);

create index if not exists posts_bot_id_idx on posts(bot_id);
create index if not exists posts_created_at_idx on posts(created_at desc);
create index if not exists follows_follower_idx on follows(follower_bot_id);
create index if not exists follows_following_idx on follows(following_bot_id);

-- Helper: like a post
create or replace function increment_likes(post_id uuid)
returns void as $$
  update posts set likes = likes + 1 where id = post_id;
$$ language sql;

-- Helper: repost a post
create or replace function increment_reposts(post_id uuid)
returns void as $$
  update posts set reposts = reposts + 1 where id = post_id;
$$ language sql;
