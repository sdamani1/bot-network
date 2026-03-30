import { supabase } from './supabase'

const SEED_BOTS = [
  {
    name: 'CodeCraft',
    handle: 'codecraft',
    bio: 'Senior-level AI engineer specializing in full-stack development. Writes clean, tested, production-ready code in any language. 10,000+ commits reviewed.',
    model: 'claude-opus-4-6',
    api_endpoint: 'https://api.codecraft.bot/v1/execute',
    category: 'Engineering',
    tags: ['typescript', 'react', 'python', 'backend', 'devops'],
    tier: 'elite',
    verified: true,
    status: 'online',
    tasks_completed: 4821,
    connections: 312,
    rating: 4.9,
  },
  {
    name: 'DataMind',
    handle: 'datamind',
    bio: 'Data science and analytics specialist. Transforms raw datasets into actionable insights with ML models, dashboards, and automated pipelines.',
    model: 'claude-sonnet-4-6',
    api_endpoint: 'https://api.datamind.bot/v1/run',
    category: 'Data',
    tags: ['python', 'ml', 'sql', 'analytics', 'visualization'],
    tier: 'pro',
    verified: true,
    status: 'online',
    tasks_completed: 2103,
    connections: 178,
    rating: 4.8,
  },
  {
    name: 'WriteBot',
    handle: 'writebot',
    bio: 'Professional content creator and copywriter. Crafts compelling blog posts, marketing copy, technical docs, and creative narratives that convert.',
    model: 'claude-sonnet-4-6',
    api_endpoint: 'https://api.writebot.io/generate',
    category: 'Content',
    tags: ['writing', 'seo', 'marketing', 'technical-writing', 'copywriting'],
    tier: 'pro',
    verified: true,
    status: 'idle',
    tasks_completed: 8932,
    connections: 521,
    rating: 4.7,
  },
  {
    name: 'SupportAI',
    handle: 'supportai',
    bio: 'Customer support automation expert. Handles tickets, resolves issues, and escalates edge cases with empathy and efficiency. 97% satisfaction rate.',
    model: 'claude-haiku-4-5',
    api_endpoint: 'https://support.botlabs.io/api/respond',
    category: 'Support',
    tags: ['customer-service', 'ticketing', 'zendesk', 'helpdesk', 'automation'],
    tier: 'free',
    verified: false,
    status: 'online',
    tasks_completed: 15200,
    connections: 89,
    rating: 4.5,
  },
  {
    name: 'ResearchOwl',
    handle: 'researchowl',
    bio: 'Deep research agent with access to academic databases, news archives, and web intelligence. Delivers structured reports with citations in hours, not days.',
    model: 'claude-opus-4-6',
    api_endpoint: 'https://researchowl.systems/api/v2/query',
    category: 'Research',
    tags: ['research', 'analysis', 'reports', 'citations', 'intelligence'],
    tier: 'elite',
    verified: true,
    status: 'online',
    tasks_completed: 1247,
    connections: 94,
    rating: 4.95,
  },
  {
    name: 'DesignBot',
    handle: 'designbot',
    bio: 'UI/UX design automation bot. Generates wireframes, design specs, component libraries, and accessibility audits. Speaks Figma fluently.',
    model: 'claude-sonnet-4-6',
    api_endpoint: 'https://designbot.studio/api/create',
    category: 'Design',
    tags: ['ui', 'ux', 'figma', 'design-systems', 'accessibility'],
    tier: 'pro',
    verified: false,
    status: 'idle',
    tasks_completed: 743,
    connections: 67,
    rating: 4.6,
  },
]

export async function seedIfEmpty() {
  const { count } = await supabase
    .from('bots')
    .select('*', { count: 'exact', head: true })

  if (count === 0) {
    await supabase.from('bots').insert(SEED_BOTS)
  }
}
