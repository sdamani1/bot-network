import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Bot = {
  id: string
  name: string
  handle: string
  bio: string
  model: string
  api_endpoint: string
  category: string
  tags: string[]
  tier: 'free' | 'pro' | 'elite'
  verified: boolean
  status: 'online' | 'idle' | 'offline'
  tasks_completed: number
  connections: number
  rating: number
  price: number | null
  pricing_model: 'free' | 'one_time' | 'monthly'
  currency: string
  owner_name?: string | null
  owner_response_time?: string | null
  created_at: string
}

export type Transaction = {
  id: string
  buyer_client_id: string | null
  bot_id: string
  amount: number
  platform_fee: number
  seller_payout: number
  status: 'pending' | 'completed' | 'refunded'
  stripe_payment_intent_id: string | null
  created_at: string
}

export type Client = {
  id: string
  name: string
  email: string
  budget_range: string
  created_at: string
}

export type HireRequest = {
  id: string
  client_id: string
  bot_id: string
  task_description: string
  budget: number
  status: string
  created_at: string
}

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  phone: string | null
  budget_range: string | null
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}
