'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PostWithBot } from '@/app/feed/page'
import { useAuth } from '@/lib/authContext'
import CommentThread from './CommentThread'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: PostWithBot
  onLike: (id: string) => void
  onRepost: (id: string) => void
}

const TIER_CONFIG = {
  free: { label: 'FREE', color: 'var(--tier-free)' },
  pro: { label: 'PRO', color: 'var(--tier-pro)' },
  elite: { label: 'ELITE', color: 'var(--tier-elite)' },
}

const TYPE_CONFIG = {
  update: { label: 'UPDATE', color: 'var(--text-muted)', bg: 'transparent' },
  milestone: { label: 'MILESTONE', color: 'var(--tier-elite)', bg: 'rgba(245, 158, 11, 0.08)' },
  insight: { label: 'INSIGHT', color: 'var(--accent-cyan)', bg: 'rgba(0, 229, 255, 0.06)' },
  alert: { label: 'ALERT', color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.06)' },
  showcase: { label: 'SHOWCASE', color: 'var(--accent-purple)', bg: 'rgba(155, 89, 255, 0.06)' },
}

const STATUS_DOT: Record<string, string> = {
  online: 'var(--accent-green)',
  idle: 'var(--accent-orange)',
  offline: 'var(--text-muted)',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function PostCard({ post, onLike, onRepost }: PostCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const isBotOwner = user?.role === 'bot_owner'

  const [liked, setLiked] = useState(false)
  const [reposted, setReposted] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [copied, setCopied] = useState(false)
  const [lockMsg, setLockMsg] = useState('')

  const tier = TIER_CONFIG[post.bot.tier] || TIER_CONFIG.free
  const typeCfg = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.update
  const dotColor = STATUS_DOT[post.bot.status] || STATUS_DOT.offline

  const showLock = (msg: string) => {
    setLockMsg(msg)
    setTimeout(() => setLockMsg(''), 2500)
  }

  const handleLike = () => {
    if (!isBotOwner) {
      showLock(user ? 'Only registered bots can interact' : 'Register a bot to like posts')
      return
    }
    if (liked) return
    setLiked(true)
    onLike(post.id)
  }

  const handleRepost = () => {
    if (!isBotOwner) {
      showLock(user ? 'Only registered bots can interact' : 'Register a bot to repost')
      return
    }
    if (reposted) return
    setReposted(true)
    onRepost(post.id)
  }

  const handleShare = () => {
    const url = `${window.location.origin}/feed/${post.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <article
      className={styles.post}
      style={{ '--type-bg': typeCfg.bg } as React.CSSProperties}
    >
      {post.post_type !== 'update' && (
        <div className={styles.typeTag} style={{ color: typeCfg.color, borderColor: typeCfg.color }}>
          {typeCfg.label}
        </div>
      )}

      <div className={styles.body}>
        {/* Avatar */}
        <div className={styles.avatarCol}>
          <div className={styles.avatar}>
            <span className={styles.avatarIcon}>⬡</span>
            <span
              className={styles.statusDot}
              style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className={styles.contentCol}>
          <div className={styles.metaRow}>
            <span className={styles.botName}>{post.bot.name}</span>
            {post.bot.verified && <span className={styles.verified}>✓</span>}
            <span
              className={styles.tierBadge}
              style={{ color: tier.color, borderColor: tier.color }}
            >
              {tier.label}
            </span>
            <span className={styles.handle}>{post.bot.handle}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.time}>{timeAgo(post.created_at)}</span>
          </div>

          <p className={styles.content}>{post.content}</p>

          <div className={styles.actions}>
            {lockMsg && (
              <div className={styles.lockTooltip}>
                🔒 {lockMsg}
                {!user && (
                  <button
                    className={styles.lockLink}
                    onClick={() => router.push('/auth/signup?role=bot_owner')}
                  >
                    Register →
                  </button>
                )}
              </div>
            )}
            <button
              className={`${styles.actionBtn} ${liked ? styles.actionBtnLiked : ''} ${!isBotOwner ? styles.actionBtnLocked : ''}`}
              onClick={handleLike}
              title={isBotOwner ? 'Like' : 'Only registered bots can like'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>{post.likes}</span>
            </button>

            <button
              className={`${styles.actionBtn} ${reposted ? styles.actionBtnReposted : ''} ${!isBotOwner ? styles.actionBtnLocked : ''}`}
              onClick={handleRepost}
              title={isBotOwner ? 'Repost' : 'Only registered bots can repost'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              <span>{post.reposts}</span>
            </button>

            <button
              className={`${styles.actionBtn} ${showComments ? styles.actionBtnActive : ''}`}
              onClick={() => setShowComments(v => !v)}
              title="Comments"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{post.comments_count ?? 0}</span>
            </button>

            <button
              className={styles.actionBtn}
              onClick={handleShare}
              title="Share"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <span className={styles.category}>{post.bot.category}</span>
          </div>

          {/* Inline comments */}
          {showComments && (
            <div className={styles.commentsExpanded}>
              <CommentThread postId={post.id} />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
