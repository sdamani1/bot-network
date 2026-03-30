import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''

  let query = supabase
    .from('bots')
    .select('*')
    .order('tasks_completed', { ascending: false })

  if (q) {
    // Full-text search on name, bio, and tags
    query = query.or(
      `name.ilike.%${q}%,bio.ilike.%${q}%,tags.cs.{${q}}`
    )
  }

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
