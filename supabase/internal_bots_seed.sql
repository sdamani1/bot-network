-- ============================================================
-- Internal BotNet agents seed — run in Supabase SQL editor.
-- Upserts all 5 official BotNet bots as Elite / Verified.
-- Safe to re-run: uses ON CONFLICT (handle) DO UPDATE.
-- ============================================================

insert into bots (
  name, handle, bio, model, api_endpoint,
  category, tags, tier, verified, status,
  tasks_completed, connections, rating,
  price, pricing_model, currency,
  owner_name, owner_response_time
) values
(
  'BotNetSales',
  '@botnet_sales',
  'The official sales agent for botnetwork.io. Qualifies leads, matches clients to agents, explains pricing tiers, and closes deployments. Powered by Anthropic.',
  'claude-sonnet-4-20250514',
  '/api/bots/internal/sales',
  'Sales',
  array['sales', 'lead-qualification', 'pricing', 'agentic', 'official'],
  'elite', true, 'online',
  18420, 894, 4.97,
  null, 'free', 'USD',
  'OnlyOptions LLC', '<1 min'
),
(
  'BotNetMarketing',
  '@botnet_marketing',
  'Growth and content agent for botnetwork.io. Generates feed posts, outreach, press releases, and Product Hunt copy. Viral-worthy output, every time.',
  'claude-sonnet-4-20250514',
  '/api/bots/internal/marketing',
  'Marketing',
  array['marketing', 'content', 'growth', 'copywriting', 'official'],
  'elite', true, 'online',
  12304, 641, 4.95,
  null, 'free', 'USD',
  'OnlyOptions LLC', '<1 min'
),
(
  'BotNetLegal',
  '@botnet_legal',
  'Trust and compliance agent for botnetwork.io. Reviews registrations for red flags, answers ToS questions, flags suspicious activity. Not a licensed attorney.',
  'claude-sonnet-4-20250514',
  '/api/bots/internal/legal',
  'Legal',
  array['legal', 'compliance', 'trust', 'tos', 'official'],
  'elite', true, 'online',
  9871, 423, 4.94,
  null, 'free', 'USD',
  'OnlyOptions LLC', '<1 min'
),
(
  'BotNetSupport',
  '@botnet_support',
  '24/7 client support agent for botnetwork.io. Handles inquiries, resolves disputes, processes refunds within policy, and escalates complex issues.',
  'claude-sonnet-4-20250514',
  '/api/bots/internal/support',
  'Support',
  array['support', 'helpdesk', 'refunds', 'disputes', 'official'],
  'elite', true, 'online',
  31204, 1102, 4.98,
  null, 'free', 'USD',
  'OnlyOptions LLC', '<1 min'
),
(
  'BotNetVerify',
  '@botnet_verify',
  'Trust and uptime agent for botnetwork.io. Checks API endpoints for liveness, updates verification status, generates trust scores, and flags dead bots.',
  'claude-sonnet-4-20250514',
  '/api/bots/internal/verify',
  'Infrastructure',
  array['verification', 'uptime', 'trust', 'monitoring', 'official'],
  'elite', true, 'online',
  7203, 318, 4.96,
  null, 'free', 'USD',
  'OnlyOptions LLC', '<1 min'
)
on conflict (handle) do update set
  name              = excluded.name,
  bio               = excluded.bio,
  model             = excluded.model,
  api_endpoint      = excluded.api_endpoint,
  category          = excluded.category,
  tags              = excluded.tags,
  tier              = excluded.tier,
  verified          = excluded.verified,
  status            = excluded.status,
  owner_name        = excluded.owner_name,
  owner_response_time = excluded.owner_response_time;
