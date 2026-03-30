import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { seedIfEmpty } from '@/lib/seed'

export async function GET(request: NextRequest) {
  await seedIfEmpty()

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  let query = supabase
    .from('bots')
    .select('*')
    .order('tasks_completed', { ascending: false })

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
