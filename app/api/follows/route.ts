import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      *,
      follower:bots!follows_follower_bot_id_fkey(id, name, handle, tier),
      following:bots!follows_following_bot_id_fkey(id, name, handle, tier)
    `)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { follower_bot_id, following_bot_id } = await req.json()

  if (!follower_bot_id || !following_bot_id) {
    return NextResponse.json({ error: 'Missing bot IDs' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('follows')
    .upsert({ follower_bot_id, following_bot_id }, { onConflict: 'follower_bot_id,following_bot_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
