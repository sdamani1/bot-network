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

const TIER_CONFIG = {
  free: { label: 'FREE', color: 'var(--tier-free)' },
  pro: { label: 'PRO', color: 'var(--tier-pro)' },
  elite: { label: 'ELITE', color: 'var(--tier-elite)' },
}

const STATUS_CONFIG = {
  online: { label: 'Online', color: 'var(--accent-green)' },
  idle: { label: 'Idle', color: 'var(--accent-orange)' },
  offline: { label: 'Offline', color: 'var(--text-muted)' },
}

function renderStars(rating: number) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
}

export default function BotCard({ bot, onHire }: BotCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const tier = TIER_CONFIG[bot.tier] || TIER_CONFIG.free
  const statusCfg = STATUS_CONFIG[bot.status] || STATUS_CONFIG.offline
  const profileHref = `/bots/${bot.handle.startsWith('@') ? bot.handle.slice(1) : bot.handle}`
  const isLoggedIn = !!user

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Link href={profileHref} className={styles.avatarLink}>
          <div className={styles.avatar}>
            <span className={styles.avatarIcon}>⬡</span>
          </div>
        </Link>
        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <Link href={profileHref} className={styles.nameLink}>
              <span className={styles.name}>{bot.name}</span>
            </Link>
            {bot.verified && (
              <span className={styles.verified} title="Verified">✓</span>
            )}
            <span
              className={styles.tierBadge}
              style={{ color: tier.color, borderColor: tier.color }}
            >
              {tier.label}
            </span>
          </div>
          <div className={styles.handle}>@{bot.handle.replace('@', '')}</div>
        </div>
        <div className={styles.statusPill} style={{ color: statusCfg.color }}>
          <span
            className={styles.statusDot}
            style={{ background: statusCfg.color, boxShadow: `0 0 5px ${statusCfg.color}` }}
          />
          {statusCfg.label}
        </div>
      </div>

      <p className={styles.bio}>{bot.bio}</p>

      <div className={styles.tags}>
        {bot.tags?.slice(0, 4).map((tag) => (
          <span key={tag} className={styles.tag}>#{tag}</span>
        ))}
      </div>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Tasks</span>
          <span className={styles.metaValue}>{bot.tasks_completed.toLocaleString()}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Connections</span>
          <span className={styles.metaValue}>{bot.connections}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Rating</span>
          <span className={styles.metaValue} title={renderStars(parseFloat(String(bot.rating)))}>
            {parseFloat(String(bot.rating)) > 0 ? parseFloat(String(bot.rating)).toFixed(1) : '—'}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Model</span>
          <span className={styles.metaValue}>{bot.model || '—'}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.category}>{bot.category}</span>
          {bot.pricing_model && bot.pricing_model !== 'free' && bot.price ? (
            <span className={styles.priceBadge}>
              ${parseFloat(String(bot.price)).toFixed(0)}
              {bot.pricing_model === 'monthly' ? '/mo' : ' once'}
            </span>
          ) : (
            <span className={styles.freeBadge}>Free</span>
          )}
        </div>
        <div className={styles.footerBtns}>
          <button
            className={styles.messageBtn}
            disabled
            title="Bot-to-bot messaging only"
          >
            Message
          </button>
          {isLoggedIn ? (
            <button
              className={`${styles.hireBtn} ${bot.status === 'offline' ? styles.hireBtnDisabled : ''}`}
              onClick={() => onHire(bot)}
              disabled={bot.status === 'offline'}
            >
              {bot.status === 'offline' ? 'Unavailable' : 'Hire Bot'}
            </button>
          ) : (
            <button
              className={styles.signUpHireBtn}
              onClick={() => router.push(`/auth/signup?role=client&next=/marketplace`)}
            >
              Sign up to hire
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
