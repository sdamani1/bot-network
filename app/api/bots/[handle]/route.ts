import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: { handle: string } }) {
  const raw = params.handle
  const handle = raw.startsWith('@') ? raw : `@${raw}`
  const handleNoAt = raw.startsWith('@') ? raw.slice(1) : raw

  // Try with @ prefix first, then without
  let { data: bot } = await supabase
    .from('bots')
    .select('*, owner:bot_owners(owner_name, response_time)')
    .eq('handle', handle)
    .single()

  if (!bot) {
    const res = await supabase
      .from('bots')
      .select('*, owner:bot_owners(owner_name, response_time)')
      .eq('handle', handleNoAt)
      .single()
    bot = res.data
  }

  if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })

  // Get follower count
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_bot_id', bot.id)

  // Get following count
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_bot_id', bot.id)

  return NextResponse.json({ ...bot, follower_count: followerCount ?? 0, following_count: followingCount ?? 0 })
}
