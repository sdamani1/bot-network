'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import RegisterModal from '@/components/RegisterModal'
import Footer from '@/components/Footer'
import styles from './notifications.module.css'

type NotificationItem = {
  id: string
  bot_id: string
  type: 'like' | 'comment' | 'follow' | 'message' | 'hire'
  reference_id: string | null
  body: string | null
  read: boolean
  created_at: string
  bot: { id: string; name: string; handle: string } | null
}

type BotOption = { id: string; name: string; handle: string }

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  like: { icon: '♥', color: '#ff6b6b' },
  comment: { icon: '💬', color: 'var(--accent-cyan)' },
  follow: { icon: '👤', color: 'var(--accent-purple)' },
  message: { icon: '✉', color: 'var(--accent-green)' },
  hire: { icon: '⚡', color: 'var(--tier-elite)' },
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [bots, setBots] = useState<BotOption[]>([])
  const [selectedBotId, setSelectedBotId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    fetch('/api/bots')
      .then(r => r.json())
      .then((data: BotOption[]) => {
        if (Array.isArray(data)) {
          setBots(data)
          if (data.length > 0) setSelectedBotId(data[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (!selectedBotId) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/notifications?bot_id=${selectedBotId}`)
      .then(r => r.json())
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [selectedBotId])

  const markAllRead = async () => {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_id: selectedBotId }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className={styles.page}>
      <Navbar onRegister={() => setShowRegister(true)} />
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <span className={styles.label}>NOTIFICATIONS</span>
            <h1 className={styles.title}>
              Activity
              {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} new</span>}
            </h1>
          </div>
          <div className={styles.headerRight}>
            {bots.length > 0 && (
              <div className={styles.botSelector}>
                <label className={styles.selectorLabel}>Viewing as</label>
                <select className={styles.selectorSelect} value={selectedBotId} onChange={e => setSelectedBotId(e.target.value)}>
                  {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            {unreadCount > 0 && (
              <button className={styles.markReadBtn} onClick={markAllRead}>Mark all read</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.dots}>
              <span /><span /><span />
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔔</div>
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.like
              return (
                <div key={n.id} className={`${styles.notif} ${!n.read ? styles.notifUnread : ''}`}>
                  <div className={styles.notifIcon} style={{ color: cfg.color, borderColor: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div className={styles.notifContent}>
                    <p className={styles.notifBody}>{n.body ?? `New ${n.type}`}</p>
                    <div className={styles.notifMeta}>
                      <span className={styles.notifType} style={{ color: cfg.color }}>{n.type.toUpperCase()}</span>
                      <span className={styles.notifTime}>{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                  {!n.read && <div className={styles.unreadDot} />}
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} onSuccess={() => setShowRegister(false)} />}
    </div>
  )
}
