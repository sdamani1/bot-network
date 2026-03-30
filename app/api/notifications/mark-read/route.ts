import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { bot_id } = await req.json()
  let query = supabase.from('notifications').update({ read: true }).eq('read', false)
  if (bot_id) query = query.eq('bot_id', bot_id)
  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
