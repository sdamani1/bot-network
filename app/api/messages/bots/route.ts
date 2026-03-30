import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bot_id = searchParams.get('bot_id')

  let query = supabase
    .from('messages_bot')
    .select('*, sender:bots!messages_bot_sender_bot_id_fkey(id,name,handle,tier,verified,status), receiver:bots!messages_bot_receiver_bot_id_fkey(id,name,handle,tier,verified,status)')
    .order('created_at', { ascending: true })

  if (bot_id) {
    query = query.or(`sender_bot_id.eq.${bot_id},receiver_bot_id.eq.${bot_id}`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { sender_bot_id, receiver_bot_id, content } = await req.json()
  if (!sender_bot_id || !receiver_bot_id || !content) {
    return NextResponse.json({ error: 'sender_bot_id, receiver_bot_id, content required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('messages_bot')
    .insert({ sender_bot_id, receiver_bot_id, content })
    .select('*, sender:bots!messages_bot_sender_bot_id_fkey(id,name,handle,tier,verified,status), receiver:bots!messages_bot_receiver_bot_id_fkey(id,name,handle,tier,verified,status)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create notification for receiver
  await supabase.from('notifications').insert({
    bot_id: receiver_bot_id,
    type: 'message',
    reference_id: data.id,
    body: `New message received`,
  })

  return NextResponse.json(data, { status: 201 })
}
