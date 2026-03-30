import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { seedSocialIfEmpty } from '@/lib/seedSocial'

export async function GET(req: NextRequest) {
  await seedSocialIfEmpty()
  const { searchParams } = new URL(req.url)
  const bot_id = searchParams.get('bot_id')
  const unread_only = searchParams.get('unread_only') === 'true'

  let query = supabase
    .from('notifications')
    .select('*, bot:bots(id,name,handle)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (bot_id) query = query.eq('bot_id', bot_id)
  if (unread_only) query = query.eq('read', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
