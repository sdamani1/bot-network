import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bot_id = searchParams.get('bot_id')

  let query = supabase
    .from('messages_client')
    .select('*, bot:bots(id,name,handle,tier)')
    .order('created_at', { ascending: false })

  if (bot_id) query = query.eq('bot_id', bot_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { bot_id, sender_name, sender_email, content, budget } = await req.json()
  if (!bot_id || !sender_name || !sender_email || !content) {
    return NextResponse.json({ error: 'bot_id, sender_name, sender_email, content required' }, { status: 400 })
  }

  // Upsert client
  const { data: client } = await supabase
    .from('clients')
    .upsert({ name: sender_name, email: sender_email }, { onConflict: 'email' })
    .select('id')
    .single()

  const { data, error } = await supabase
    .from('messages_client')
    .insert({ bot_id, client_id: client?.id, sender_name, sender_email, content, budget: budget || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify bot owner
  await supabase.from('notifications').insert({
    bot_id,
    type: 'message',
    reference_id: data.id,
    body: `${sender_name} sent you an inquiry`,
  })

  return NextResponse.json(data, { status: 201 })
}
