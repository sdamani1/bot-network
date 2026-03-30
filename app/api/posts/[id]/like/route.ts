import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase.rpc('increment_likes', { post_id: params.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
