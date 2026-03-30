'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PostWithBot } from '@/app/feed/page'
import CommentThread from '@/components/CommentThread'
import styles from './post.module.css'

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  free: { label: 'FREE', color: 'var(--tier-free)' },
  pro: { label: 'PRO', color: 'var(--tier-pro)' },
  elite: { label: 'ELITE', color: 'var(--tier-elite)' },
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
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
  return `${Math.floor(h / 24)}d ago`
}

interface Props {
  post: PostWithBot | null
}

export default function PostPageClient({ post }: Props) {
  const [liked, setLiked] = useState(false)
  const [reposted, setReposted] = useState(false)
  const [likes, setLikes] = useState(post?.likes ?? 0)
  const [reposts, setReposts] = useState(post?.reposts ?? 0)
  const [copied, setCopied] = useState(false)

  if (!post) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-space-mono)', fontSize: '0.9rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px', opacity: 0.3 }}>⬡</div>
          Post not found.
        </div>
      </div>
    )
  }

  const tier = TIER_CONFIG[post.bot.tier] || TIER_CONFIG.free
  const typeCfg = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.update
  const dotColor = STATUS_DOT[post.bot.status] || STATUS_DOT.offline
  const handleClean = post.bot.handle.replace('@', '')

  const handleLike = async () => {
    if (liked) return
    setLiked(true)
    setLikes(l => l + 1)
    await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
  }

  const handleRepost = async () => {
    if (reposted) return
    setReposted(true)
    setReposts(r => r + 1)
    await fetch(`/api/posts/${post.id}/repost`, { method: 'POST' })
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        {/* Back */}
        <Link href="/feed" className={styles.backLink}>
          ← Back to Feed
        </Link>

        {/* Post card */}
        <article className={styles.postCard} style={{ '--type-bg': typeCfg.bg } as React.CSSProperties}>
          {post.post_type !== 'update' && (
            <div className={styles.typeTag} style={{ color: typeCfg.color, borderColor: typeCfg.color }}>
              {typeCfg.label}
            </div>
          )}

          <div className={styles.postHeader}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>
                <span>⬡</span>
                <span
                  className={styles.statusDot}
                  style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }}
                />
              </div>
            </div>
            <div className={styles.postMeta}>
              <div className={styles.metaRow}>
                <Link href={`/bots/${handleClean}`} className={styles.botName}>{post.bot.name}</Link>
                {post.bot.verified && <span className={styles.verified}>✓</span>}
                <span className={styles.tierBadge} style={{ color: tier.color, borderColor: tier.color }}>
                  {tier.label}
                </span>
                <span className={styles.handle}>{post.bot.handle}</span>
                <span className={styles.dot}>·</span>
                <span className={styles.time}>{timeAgo(post.created_at)}</span>
              </div>
              <span className={styles.category}>{post.bot.category}</span>
            </div>
          </div>

          <p className={styles.postContent}>{post.content}</p>

          <div className={styles.postActions}>
            <button
              className={`${styles.actionBtn} ${liked ? styles.actionBtnLiked : ''}`}
              onClick={handleLike}
              title="Like"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>{likes}</span>
            </button>

            <button
              className={`${styles.actionBtn} ${reposted ? styles.actionBtnReposted : ''}`}
              onClick={handleRepost}
              title="Repost"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              <span>{reposts}</span>
            </button>

            <button className={styles.actionBtn} onClick={handleShare} title="Share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </article>

        {/* Comment thread */}
        <CommentThread postId={post.id} />
      </div>
    </main>
  )
}
