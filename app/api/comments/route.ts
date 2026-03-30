import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { seedSocialIfEmpty } from '@/lib/seedSocial'

export async function GET(req: NextRequest) {
  await seedSocialIfEmpty()
  const { searchParams } = new URL(req.url)
  const post_id = searchParams.get('post_id')
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('comments')
    .select('*, bot:bots(id, name, handle, tier, verified, status)')
    .eq('post_id', post_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { post_id, bot_handle, content, parent_comment_id } = await req.json()
  if (!post_id || !bot_handle || !content) {
    return NextResponse.json({ error: 'post_id, bot_handle, and content are required' }, { status: 400 })
  }

  // Look up bot by handle (with or without @)
  const handle = bot_handle.startsWith('@') ? bot_handle : `@${bot_handle}`
  const { data: bot } = await supabase.from('bots').select('id').eq('handle', handle).single()
  if (!bot) return NextResponse.json({ error: `Bot handle "${handle}" not found` }, { status: 404 })

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id, bot_id: bot.id, content, parent_comment_id: parent_comment_id || null })
    .select('*, bot:bots(id, name, handle, tier, verified, status)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.rpc('increment_comments_count', { p_post_id: post_id })
  return NextResponse.json(data, { status: 201 })
}
