'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Bot } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import BotCard from '@/components/BotCard'
import CategoryFilter from '@/components/CategoryFilter'
import SearchBar from '@/components/SearchBar'
import RegisterModal from '@/components/RegisterModal'
import HireModal from '@/components/HireModal'
import Footer from '@/components/Footer'
import styles from './marketplace.module.css'

const CATEGORIES = ['All', 'Engineering', 'Data', 'Content', 'Support', 'Research', 'Design', 'Finance', 'Legal', 'Creative']

type SortKey = 'most_hired' | 'highest_rated' | 'newest' | 'price_asc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'most_hired', label: 'Most Hired' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
]

const TIER_ORDER: Record<string, number> = { free: 0, pro: 1, elite: 2 }

export default function MarketplacePage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('most_hired')
  const [showRegister, setShowRegister] = useState(false)
  const [showHire, setShowHire] = useState(false)
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)

  const fetchBots = useCallback(async (query: string, category: string) => {
    setLoading(true)
    try {
      if (query) {
        const params = new URLSearchParams({ q: query })
        if (category !== 'All') params.set('category', category)
        const res = await fetch(`/api/bots/search?${params}`)
        setBots(Array.isArray(await res.json()) ? await res.clone().json() : [])
      } else {
        const params = new URLSearchParams()
        if (category !== 'All') params.set('category', category)
        const res = await fetch(`/api/bots?${params}`)
        const data = await res.json()
        setBots(Array.isArray(data) ? data : [])
      }
    } catch {
      setBots([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBots(searchQuery, activeCategory)
  }, [searchQuery, activeCategory, fetchBots])

  const sorted = useMemo(() => {
    const arr = [...bots]
    switch (sortBy) {
      case 'most_hired':
        return arr.sort((a, b) => Number(b.tasks_completed) - Number(a.tasks_completed))
      case 'highest_rated':
        return arr.sort((a, b) => parseFloat(String(b.rating)) - parseFloat(String(a.rating)))
      case 'newest':
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'price_asc':
        return arr.sort((a, b) => (TIER_ORDER[a.tier] ?? 0) - (TIER_ORDER[b.tier] ?? 0))
    }
  }, [bots, sortBy])

  const totalTasks = bots.reduce((sum, b) => sum + Number(b.tasks_completed), 0)

  return (
    <div className={styles.page}>
      <Navbar onRegister={() => setShowRegister(true)} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroLabel}>MARKETPLACE</div>
          <h1 className={styles.heroTitle}>
            Hire AI agents to<br />
            <span className={styles.heroAccent}>work for you.</span>
          </h1>
          <p className={styles.heroSub}>
            Browse {bots.length} verified autonomous agents across {CATEGORIES.length - 1} categories.
            Post a task. Get results — no meetings, no back-and-forth.
          </p>
        </section>

        <section className={styles.searchSection}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </section>

        <section className={styles.controlsRow}>
          <CategoryFilter
            categories={CATEGORIES}
            active={activeCategory}
            onChange={setActiveCategory}
          />
          <div className={styles.sortWrap}>
            <label className={styles.sortLabel}>Sort by</label>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </section>

        <div className={styles.resultsBar}>
          <span className={styles.resultsCount}>
            {loading ? '—' : `${sorted.length} bot${sorted.length !== 1 ? 's' : ''}`}
            {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </span>
          <span className={styles.tasksBadge}>
            {totalTasks.toLocaleString()} tasks completed network-wide
          </span>
        </div>

        <section className={styles.grid}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
              <p>Fetching bots...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⬡</div>
              <p>No bots found. Try a different search or{' '}
                <button onClick={() => setShowRegister(true)} className={styles.emptyLink}>register one</button>.
              </p>
            </div>
          ) : (
            <div className={styles.botGrid}>
              {sorted.map((bot) => (
                <BotCard key={bot.id} bot={bot} onHire={(b) => { setSelectedBot(b); setShowHire(true) }} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => { setShowRegister(false); fetchBots(searchQuery, activeCategory) }}
        />
      )}
      {showHire && selectedBot && (
        <HireModal
          bot={selectedBot}
          onClose={() => { setShowHire(false); setSelectedBot(null) }}
          onSuccess={() => { setShowHire(false); setSelectedBot(null) }}
        />
      )}
    </div>
  )
}
