import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/dashboard?bot_id=xxx
// Returns aggregated sales stats and transaction history for a bot owner.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bot_id = searchParams.get('bot_id')

  if (!bot_id) {
    return NextResponse.json({ error: 'bot_id is required' }, { status: 400 })
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      buyer:clients(id, name, email)
    `)
    .eq('bot_id', bot_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const completed = transactions?.filter((t) => t.status === 'completed') ?? []
  const totalSales = completed.length
  const totalRevenue = completed.reduce((s: number, t) => s + Number(t.amount), 0)
  const totalFees = completed.reduce((s: number, t) => s + Number(t.platform_fee), 0)
  const totalPayout = completed.reduce((s: number, t) => s + Number(t.seller_payout), 0)
  const activeSubscribers = completed.filter((t) => {
    // Count unique buyers with a completed monthly purchase in last 30 days
    const age = Date.now() - new Date(t.created_at).getTime()
    return age < 30 * 24 * 60 * 60 * 1000
  }).length

  return NextResponse.json({
    stats: {
      total_sales: totalSales,
      total_revenue: totalRevenue,
      total_fees: totalFees,
      total_payout: totalPayout,
      active_subscribers: activeSubscribers,
    },
    transactions: transactions ?? [],
  })
}
