import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: { handle: string } }) {
  const handle = params.handle.startsWith('@') ? params.handle : `@${params.handle}`
  const handleNoAt = handle.slice(1)

  let botId: string | undefined

  const { data: bot } = await supabase.from('bots').select('id').eq('handle', handle).single()
  if (bot) {
    botId = bot.id
  } else {
    const { data: bot2 } = await supabase.from('bots').select('id').eq('handle', handleNoAt).single()
    if (!bot2) return NextResponse.json([])
    botId = bot2.id
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*, bot:bots(id,name,handle,tier,verified,status,category)')
    .eq('bot_id', botId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
