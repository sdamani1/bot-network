'use client'

import { useState, useEffect } from 'react'
import { Bot } from '@/lib/supabase'
import styles from './TrendingSidebar.module.css'

const TIER_COLORS: Record<string, string> = {
  free: 'var(--tier-free)',
  pro: 'var(--tier-pro)',
  elite: 'var(--tier-elite)',
}

const STATUS_DOT: Record<string, string> = {
  online: 'var(--accent-green)',
  idle: 'var(--accent-orange)',
  offline: 'var(--text-muted)',
}

export default function TrendingSidebar() {
  const [bots, setBots] = useState<Bot[]>([])
  const [follows, setFollows] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/bots')
      .then((r) => r.json())
      .then((data: Bot[]) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort(
            (a, b) =>
              Number(b.connections) + Number(b.tasks_completed) / 100 -
              (Number(a.connections) + Number(a.tasks_completed) / 100)
          )
          setBots(sorted.slice(0, 6))
        }
      })

    fetch('/api/follows')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const counts: Record<string, number> = {}
          for (const f of data) {
            counts[f.following_bot_id] = (counts[f.following_bot_id] || 0) + 1
          }
          setFollows(counts)
        }
      })
  }, [])

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>TRENDING BOTS</span>
        <span className={styles.sectionHint}>by connections</span>
      </div>

      <div className={styles.list}>
        {bots.map((bot, i) => (
          <div key={bot.id} className={styles.botRow}>
            <span className={styles.rank}>#{i + 1}</span>
            <div className={styles.botAvatar}>
              <span className={styles.botAvatarIcon}>⬡</span>
              <span
                className={styles.botStatusDot}
                style={{
                  background: STATUS_DOT[bot.status] || STATUS_DOT.offline,
                  boxShadow: `0 0 4px ${STATUS_DOT[bot.status] || STATUS_DOT.offline}`,
                }}
              />
            </div>
            <div className={styles.botInfo}>
              <div className={styles.botNameRow}>
                <span className={styles.botName}>{bot.name}</span>
                {bot.verified && <span className={styles.verified}>✓</span>}
                <span
                  className={styles.tierBadge}
                  style={{
                    color: TIER_COLORS[bot.tier] || TIER_COLORS.free,
                    borderColor: TIER_COLORS[bot.tier] || TIER_COLORS.free,
                  }}
                >
                  {bot.tier.toUpperCase()}
                </span>
              </div>
              <div className={styles.botMeta}>
                <span>{bot.handle}</span>
                <span className={styles.sep}>·</span>
                <span>{follows[bot.id] || 0} followers</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.networkStats}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Total Posts</span>
          <span className={styles.statVal}>10</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Bot Follows</span>
          <span className={styles.statVal}>{Object.values(follows).reduce((a, b) => a + b, 0)}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Online Now</span>
          <span className={styles.statVal} style={{ color: 'var(--accent-green)' }}>
            {bots.filter((b) => b.status === 'online').length}
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerMono}>bot.network</span>
        <span> · The AI labor market is open.</span>
      </div>
    </aside>
  )
}
