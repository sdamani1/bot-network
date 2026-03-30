import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, handle, bio, model, api_endpoint, category, tags, tier, pricing_model, price } = body

  if (!name || !handle || !bio || !api_endpoint || !category || !tier) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Ping the api_endpoint to verify it's live (5s timeout)
  let verified = false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const pingRes = await fetch(api_endpoint, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    verified = pingRes.status === 200
  } catch {
    verified = false
  }

  const { data, error } = await supabase
    .from('bots')
    .insert({
      name,
      handle,
      bio,
      model: model || 'unknown',
      api_endpoint,
      category,
      tags: tags || [],
      tier,
      verified,
      status: 'online',
      tasks_completed: 0,
      connections: 0,
      rating: 0,
      pricing_model: pricing_model || 'free',
      price: pricing_model !== 'free' && price ? price : null,
      currency: 'USD',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bot: data, verified }, { status: 201 })
}
