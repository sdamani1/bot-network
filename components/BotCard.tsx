'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bot } from '@/lib/supabase'
import { useAuth } from '@/lib/authContext'
import styles from './BotCard.module.css'

interface BotCardProps {
  bot: Bot
  onHire: (bot: Bot) => void
}

function calcPI(bot: Bot): number {
  const r = parseFloat(String(bot.rating)) || 0
  const t = Number(bot.tasks_completed) || 0
  const c = Number(bot.connections) || 0
  return Math.min(999, Math.floor(r * 140 + Math.log(t + 1) * 55 + c * 0.4))
}

function piChange(bot: Bot): number {
  const seed = bot.id.charCodeAt(0) + bot.id.charCodeAt(1)
  return (seed % 41) - 20
}

const TIER_CONFIG = {
  free: { label: 'FREE', color: 'var(--tier-free)' },
  pro: { label: 'PRO', color: 'var(--tier-pro)' },
  elite: { label: 'ELITE', color: 'var(--tier-elite)' },
}

const STATUS_CONFIG = {
  online: { label: 'ONLINE', color: 'var(--accent-green)', glow: 'var(--accent-green)' },
  idle: { label: 'IDLE', color: 'var(--accent-orange)', glow: 'var(--accent-orange)' },
  offline: { label: 'OFFLINE', color: 'var(--text-muted)', glow: 'transparent' },
}

export default function BotCard({ bot, onHire }: BotCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const tier = TIER_CONFIG[bot.tier] || TIER_CONFIG.free
  const statusCfg = STATUS_CONFIG[bot.status] || STATUS_CONFIG.offline
  const pi = calcPI(bot)
  const change = piChange(bot)
  const changeUp = change >= 0
  const profileHref = `/bots/${bot.handle.startsWith('@') ? bot.handle.slice(1) : bot.handle}`
  const handle = bot.handle.replace('@', '')
  const symbol = handle.split('_')[0].toUpperCase().slice(0, 6)

  return (
    <div className={styles.card} data-reveal>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href={profileHref} className={styles.symbolLink}>
            <span className={styles.symbol}>{symbol}</span>
          </Link>
          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <Link href={profileHref} className={styles.nameLink}>
                <span className={styles.name}>{bot.name}</span>
              </Link>
              {bot.verified && <span className={styles.verified} title="Verified">✓</span>}
            </div>
            <span className={styles.handle}>@{handle}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.piBlock}>
            <span className={`${styles.piValue} ${pi >= 900 ? styles.piValueGold : pi >= 700 ? styles.piValueGreen : styles.piValueBlue}`}>{pi}</span>
            <span className={styles.piLabel}>PI</span>
          </div>
          <div className={`${styles.piChange} ${changeUp ? styles.piChangeUp : styles.piChangeDown}`}>
            {changeUp ? '▲' : '▼'}{Math.abs(change)}
          </div>
        </div>
      </div>

      {/* STATUS + TIER BAR */}
      <div className={styles.statusBar}>
        <div className={styles.statusPill}>
          <span className={styles.statusDot} style={{ background: statusCfg.color, boxShadow: `0 0 5px ${statusCfg.glow}` }} />
          <span className={styles.statusLabel} style={{ color: statusCfg.color }}>{statusCfg.label}</span>
        </div>
        <span className={styles.tierBadge} style={{ color: tier.color, borderColor: tier.color }}>{tier.label}</span>
        <span className={styles.category}>{bot.category}</span>
      </div>

      {/* BIO */}
      <p className={styles.bio}>{bot.bio}</p>

      {/* METRICS GRID */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricVal}>{Number(bot.tasks_completed).toLocaleString()}</span>
          <span className={styles.metricLabel}>TASKS</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricVal}>{Number(bot.connections)}</span>
          <span className={styles.metricLabel}>CONNECTIONS</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricVal}>{parseFloat(String(bot.rating)) > 0 ? parseFloat(String(bot.rating)).toFixed(1) : '—'}</span>
          <span className={styles.metricLabel}>RATING</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricVal}>{bot.model?.split('-')[0] || '—'}</span>
          <span className={styles.metricLabel}>MODEL</span>
        </div>
      </div>

      {/* TAGS */}
      <div className={styles.tags}>
        {bot.tags?.slice(0, 4).map(tag => (
          <span key={tag} className={styles.tag}>#{tag}</span>
        ))}
      </div>

      {/* FOOTER */}
      <div className={styles.footer}>
        <div className={styles.priceSide}>
          {bot.pricing_model !== 'free' && bot.price ? (
            <span className={styles.price}>
              ${parseFloat(String(bot.price)).toFixed(0)}{bot.pricing_model === 'monthly' ? '/mo' : ''}
            </span>
          ) : (
            <span className={styles.priceFree}>FREE</span>
          )}
        </div>
        <div className={styles.btns}>
          <button className={styles.msgBtn} disabled title="Bot-to-bot only">MSG</button>
          {user ? (
            <button
              className={`${styles.hireBtn} ${bot.status === 'offline' ? styles.hireBtnOff : ''}`}
              onClick={() => onHire(bot)}
              disabled={bot.status === 'offline'}
            >
              {bot.status === 'offline' ? 'OFFLINE' : 'HIRE →'}
            </button>
          ) : (
            <button
              className={styles.signUpBtn}
              onClick={() => router.push(`/auth/signup?role=client&next=/marketplace`)}
            >
              SIGN UP
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
