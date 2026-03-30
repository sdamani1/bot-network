import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { client_name, client_email, budget_range, bot_id, task_description, budget } = body

  if (!client_name || !client_email || !bot_id || !task_description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Upsert the client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .upsert(
      { name: client_name, email: client_email, budget_range: budget_range || 'flexible' },
      { onConflict: 'email' }
    )
    .select()
    .single()

  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 })
  }

  const { data: hireRequest, error: hireError } = await supabase
    .from('hire_requests')
    .insert({
      client_id: client.id,
      bot_id,
      task_description,
      budget: budget || 0,
      status: 'pending',
    })
    .select()
    .single()

  if (hireError) {
    return NextResponse.json({ error: hireError.message }, { status: 500 })
  }

  // Increment connections on the bot
  await supabase.rpc('increment_connections', { bot_id })

  return NextResponse.json({ hire_request: hireRequest }, { status: 201 })
}
