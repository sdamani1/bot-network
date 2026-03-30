'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Transaction } from '@/lib/supabase'
import { useAuth } from '@/lib/authContext'
import Navbar from '@/components/Navbar'
import RegisterModal from '@/components/RegisterModal'
import Footer from '@/components/Footer'
import styles from './dashboard.module.css'

type DashboardStats = {
  total_sales: number
  total_revenue: number
  total_fees: number
  total_payout: number
  active_subscribers: number
}

type TxWithBuyer = Transaction & {
  buyer: { id: string; name: string; email: string } | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(dateStr).toLocaleDateString()
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--accent-green)',
  pending: 'var(--accent-orange)',
  refunded: '#ff6b6b',
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBotId, setSelectedBotId] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [transactions, setTransactions] = useState<TxWithBuyer[]>([])
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?next=/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/bots')
      .then((r) => r.json())
      .then((data: Bot[]) => {
        if (Array.isArray(data)) {
          setBots(data)
          if (data.length > 0) setSelectedBotId(data[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (!selectedBotId) return
    setLoading(true)
    fetch(`/api/dashboard?bot_id=${selectedBotId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats)
        if (data.transactions) setTransactions(data.transactions)
      })
      .finally(() => setLoading(false))
  }, [selectedBotId])

  if (authLoading || !user) {
    return (
      <div className={styles.page}>
        <Navbar onRegister={() => setShowRegister(true)} />
        <main className={styles.main} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className={styles.loading}>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <p>Checking access...</p>
          </div>
        </main>
      </div>
    )
  }

  const selectedBot = bots.find((b) => b.id === selectedBotId)

  const STAT_CARDS = stats
    ? [
        { label: 'Total Sales', value: stats.total_sales.toString(), sub: 'completed transactions' },
        { label: 'Gross Revenue', value: `$${stats.total_revenue.toFixed(2)}`, sub: 'before platform fee' },
        { label: 'Your Earnings', value: `$${stats.total_payout.toFixed(2)}`, sub: '85% after 15% fee', accent: true },
        { label: 'Platform Fees Paid', value: `$${stats.total_fees.toFixed(2)}`, sub: '15% to OnlyOptions' },
        { label: 'Active Subscribers', value: stats.active_subscribers.toString(), sub: 'last 30 days' },
      ]
    : []

  return (
    <div className={styles.page}>
      <Navbar onRegister={() => setShowRegister(true)} />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <span className={styles.label}>BOT OWNER DASHBOARD</span>
            <h1 className={styles.title}>Sales & Earnings</h1>
          </div>
          {bots.length > 0 && (
            <div className={styles.botSelector}>
              <label className={styles.selectorLabel}>Viewing bot</label>
              <select
                className={styles.selectorSelect}
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.handle})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedBot && (
          <div className={styles.botInfo}>
            <div className={styles.botInfoAvatar}>⬡</div>
            <div>
              <div className={styles.botInfoName}>{selectedBot.name}</div>
              <div className={styles.botInfoMeta}>
                {selectedBot.handle} · {selectedBot.category} ·{' '}
                {selectedBot.pricing_model === 'free'
                  ? 'Free'
                  : selectedBot.pricing_model === 'monthly'
                  ? `$${parseFloat(String(selectedBot.price ?? 0)).toFixed(0)}/mo`
                  : `$${parseFloat(String(selectedBot.price ?? 0)).toFixed(0)} one-time`}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div className={styles.statsGrid}>
              {STAT_CARDS.map((card) => (
                <div key={card.label} className={`${styles.statCard} ${card.accent ? styles.statCardAccent : ''}`}>
                  <span className={styles.statLabel}>{card.label}</span>
                  <span className={styles.statValue}>{card.value}</span>
                  <span className={styles.statSub}>{card.sub}</span>
                </div>
              ))}
            </div>

            {/* TRANSACTION TABLE */}
            <div className={styles.tableSection}>
              <div className={styles.tableSectionHeader}>
                <h2 className={styles.tableTitle}>Transaction History</h2>
                <span className={styles.tableCount}>{transactions.length} records</span>
              </div>

              {transactions.length === 0 ? (
                <div className={styles.noTx}>
                  <p>No transactions yet.</p>
                  <p className={styles.noTxSub}>Transactions will appear here once clients purchase this bot.</p>
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Buyer</th>
                        <th>Amount</th>
                        <th>Platform Fee (15%)</th>
                        <th>Your Payout (85%)</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>
                            <div className={styles.buyerCell}>
                              <span className={styles.buyerName}>{tx.buyer?.name || 'Anonymous'}</span>
                              <span className={styles.buyerEmail}>{tx.buyer?.email || '—'}</span>
                            </div>
                          </td>
                          <td className={styles.amountCell}>${parseFloat(String(tx.amount)).toFixed(2)}</td>
                          <td className={styles.feeCell}>−${parseFloat(String(tx.platform_fee)).toFixed(2)}</td>
                          <td className={styles.payoutCell}>+${parseFloat(String(tx.seller_payout)).toFixed(2)}</td>
                          <td>
                            <span
                              className={styles.statusBadge}
                              style={{ color: STATUS_COLOR[tx.status], borderColor: STATUS_COLOR[tx.status] }}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className={styles.dateCell}>{timeAgo(tx.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />

      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} onSuccess={() => setShowRegister(false)} />
      )}
    </div>
  )
}
