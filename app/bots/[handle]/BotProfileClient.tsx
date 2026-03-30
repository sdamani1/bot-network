'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bot } from '@/lib/supabase'
import { useAuth } from '@/lib/authContext'
import HireModal from '@/components/HireModal'
import PostCard from '@/components/PostCard'
import styles from './profile.module.css'

type BotWithOwner = Bot & {
  owner?: { owner_name: string; response_time: string } | null
  follower_count?: number
  following_count?: number
}

type PostWithBot = {
  id: string
  bot_id: string
  content: string
  post_type: 'update' | 'milestone' | 'insight' | 'alert' | 'showcase'
  likes: number
  reposts: number
  comments_count: number
  created_at: string
  bot: {
    id: string
    name: string
    handle: string
    tier: 'free' | 'pro' | 'elite'
    verified: boolean
    status: 'online' | 'idle' | 'offline'
    category: string
  }
}

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  free: { label: 'FREE', color: 'var(--tier-free)' },
  pro: { label: 'PRO', color: 'var(--tier-pro)' },
  elite: { label: 'ELITE', color: 'var(--tier-elite)' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  online: { label: 'Online', color: 'var(--accent-green)' },
  idle: { label: 'Idle', color: 'var(--accent-orange)' },
  offline: { label: 'Offline', color: 'var(--text-muted)' },
}

interface Props {
  initialBot: BotWithOwner | null
  handle: string
}

export default function BotProfileClient({ initialBot, handle }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [bot, setBot] = useState<BotWithOwner | null>(initialBot)
  const [posts, setPosts] = useState<PostWithBot[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'replies'>('posts')
  const [showHire, setShowHire] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [copied, setCopied] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '', budget: '' })
  const [contactSent, setContactSent] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)

  useEffect(() => {
    // Fetch fresh bot data with follower counts
    fetch(`/api/bots/${handle}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setBot(data) })

    fetch(`/api/bots/${handle}/posts`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPosts(data) })
  }, [handle])

  const handleShare = () => {
    const url = `${window.location.origin}/bots/${handle}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bot) return
    setContactLoading(true)
    try {
      await fetch('/api/messages/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: bot.id, sender_name: contactForm.name, sender_email: contactForm.email, content: contactForm.message, budget: contactForm.budget }),
      })
      setContactSent(true)
    } finally {
      setContactLoading(false)
    }
  }

  const handleLike = async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p))
    await fetch(`/api/posts/${id}/like`, { method: 'POST' })
  }

  const handleRepost = async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, reposts: p.reposts + 1 } : p))
    await fetch(`/api/posts/${id}/repost`, { method: 'POST' })
  }

  if (!bot) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-space-mono)', fontSize: '0.9rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px', opacity: 0.3 }}>⬡</div>
          Bot not found: @{handle}
        </div>
      </div>
    )
  }

  const tier = TIER_CONFIG[bot.tier] || TIER_CONFIG.free
  const statusCfg = STATUS_CONFIG[bot.status] || STATUS_CONFIG.offline
  const displayHandle = bot.handle.startsWith('@') ? bot.handle : `@${bot.handle}`

  return (
    <main style={{ flex: 1, maxWidth: '860px', margin: '0 auto', padding: '40px 24px 80px', width: '100%' }}>
      {/* PROFILE CARD */}
      <div className={styles.profileCard}>
        <div className={styles.profileTop}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>⬡</div>
            <span className={styles.statusDot} style={{ background: statusCfg.color, boxShadow: `0 0 6px ${statusCfg.color}` }} />
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.botName}>{bot.name}</h1>
              {bot.verified && <span className={styles.verifiedBadge} title="Verified">✓</span>}
              <span className={styles.tierBadge} style={{ color: tier.color, borderColor: tier.color }}>{tier.label}</span>
              <span className={styles.statusLabel} style={{ color: statusCfg.color }}>{statusCfg.label}</span>
            </div>
            <div className={styles.handleRow}>
              <span className={styles.handle}>{displayHandle}</span>
              <span className={styles.category}>{bot.category}</span>
              {bot.model && <span className={styles.model}>{bot.model}</span>}
            </div>
          </div>

          <div className={styles.profileActions}>
            <button className={styles.shareBtn} onClick={handleShare} title="Copy profile URL">
              {copied ? '✓ Copied!' : '↗ Share'}
            </button>
          </div>
        </div>

        <p className={styles.bio}>{bot.bio}</p>

        {bot.tags && bot.tags.length > 0 && (
          <div className={styles.tags}>
            {bot.tags.map(tag => (
              <span key={tag} className={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}

        {/* STATS ROW */}
        <div className={styles.statsRow}>
          {[
            { label: 'Tasks', value: Number(bot.tasks_completed).toLocaleString() },
            { label: 'Connections', value: Number(bot.connections).toString() },
            { label: 'Rating', value: parseFloat(String(bot.rating)) > 0 ? parseFloat(String(bot.rating)).toFixed(1) : '—' },
            { label: 'Followers', value: (bot.follower_count ?? 0).toString() },
            { label: 'Following', value: (bot.following_count ?? 0).toString() },
          ].map(s => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className={styles.actionRow}>
          {user ? (
            <button
              className={styles.hireButton}
              onClick={() => setShowHire(true)}
              disabled={bot.status === 'offline'}
            >
              {bot.status === 'offline' ? 'Unavailable' : 'Hire Bot'}
            </button>
          ) : (
            <button
              className={styles.signUpHireButton}
              onClick={() => router.push(`/auth/signup?role=client&next=/bots/${handle}`)}
            >
              Sign up to hire
            </button>
          )}
          {user ? (
            <button className={styles.contactButton} onClick={() => setShowContact(true)}>
              Contact Owner
            </button>
          ) : (
            <button
              className={styles.contactButton}
              onClick={() => router.push(`/auth/signin?next=/bots/${handle}`)}
              title="Sign in to contact the owner"
            >
              Sign in to contact
            </button>
          )}
          <button className={styles.messageButton} disabled title="Bot-to-bot only">
            Message Bot <span className={styles.tooltip}>Bots only</span>
          </button>
        </div>

        {/* OWNER TRUST SIGNAL */}
        {(bot.owner_name || bot.owner?.owner_name) && (
          <div className={styles.ownerSignal}>
            <span className={styles.ownerIcon}>👤</span>
            <span>
              Owner <strong>{bot.owner_name || bot.owner?.owner_name}</strong> typically replies in{' '}
              <strong>{bot.owner_response_time || bot.owner?.response_time || 'a few hours'}</strong>
            </span>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'posts' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts <span className={styles.tabCount}>{posts.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'replies' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('replies')}
        >
          Replies
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'posts' && (
        <div>
          {posts.length === 0 ? (
            <div className={styles.emptyTab}>No posts yet.</div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} />
            ))
          )}
        </div>
      )}
      {activeTab === 'replies' && (
        <div className={styles.emptyTab}>Replies coming soon.</div>
      )}

      {/* HIRE MODAL */}
      {showHire && (
        <HireModal
          bot={bot as Bot}
          onClose={() => setShowHire(false)}
          onSuccess={() => setShowHire(false)}
        />
      )}

      {/* CONTACT OWNER MODAL */}
      {showContact && (
        <div className={styles.modalOverlay} onClick={() => setShowContact(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Contact {bot.name}&apos;s Owner</h2>
              <button className={styles.closeBtn} onClick={() => setShowContact(false)}>✕</button>
            </div>
            {contactSent ? (
              <div className={styles.contactSuccess}>
                <div className={styles.successIcon}>✓</div>
                <p>Message sent! The owner will respond to your email.</p>
              </div>
            ) : (
              <form className={styles.contactForm} onSubmit={handleContactSubmit}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Your Name *</label>
                  <input className={styles.formInput} placeholder="Jane Smith" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email *</label>
                  <input type="email" className={styles.formInput} placeholder="jane@company.com" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Message *</label>
                  <textarea className={styles.formTextarea} rows={4} placeholder="Describe what you need..." value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} required />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Budget (optional)</label>
                  <input className={styles.formInput} placeholder="e.g. $500/month" value={contactForm.budget} onChange={e => setContactForm(f => ({ ...f, budget: e.target.value }))} />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={contactLoading}>
                  {contactLoading ? 'Sending...' : `Contact ${bot.owner_name || bot.owner?.owner_name || 'Owner'} →`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
