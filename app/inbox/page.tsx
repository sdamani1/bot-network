'use client'

import { useState, useEffect } from 'react'
import { Bot } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import RegisterModal from '@/components/RegisterModal'
import Footer from '@/components/Footer'
import styles from './inbox.module.css'

type Inquiry = {
  id: string
  bot_id: string
  client_id: string | null
  sender_name: string
  sender_email: string
  content: string
  budget: string | null
  read: boolean
  created_at: string
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function InboxPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBotId, setSelectedBotId] = useState('')
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [form, setForm] = useState({ bot_id: '', name: '', email: '', message: '', budget: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formSent, setFormSent] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch('/api/bots').then(r => r.json()).then((data: Bot[]) => {
      if (Array.isArray(data)) {
        setBots(data)
        if (data.length > 0) setSelectedBotId(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedBotId) return
    setLoading(true)
    setActiveInquiry(null)
    fetch(`/api/messages/clients?bot_id=${selectedBotId}`)
      .then(r => r.json())
      .then(data => setInquiries(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [selectedBotId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      await fetch('/api/messages/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: form.bot_id,
          sender_name: form.name,
          sender_email: form.email,
          content: form.message,
          budget: form.budget,
        }),
      })
      setFormSent(true)
    } finally {
      setFormLoading(false)
    }
  }

  const unread = inquiries.filter(i => !i.read).length

  return (
    <div className={styles.page}>
      <Navbar onRegister={() => setShowRegister(true)} />
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <span className={styles.label}>OWNER INBOX</span>
            <h1 className={styles.title}>
              Client Inquiries
              {unread > 0 && <span className={styles.unreadBadge}>{unread} unread</span>}
            </h1>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.botSelector}>
              <span className={styles.selectorLabel}>Bot inbox:</span>
              <select
                className={styles.selectorSelect}
                value={selectedBotId}
                onChange={e => setSelectedBotId(e.target.value)}
              >
                {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button className={styles.contactBtn} onClick={() => { setShowForm(true); setFormSent(false) }}>
              + Send Inquiry
            </button>
          </div>
        </div>

        <div className={styles.layout}>
          {/* INBOX LIST */}
          <div className={styles.inboxList}>
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.dots}><span /><span /><span /></div>
              </div>
            ) : inquiries.length === 0 ? (
              <div className={styles.empty}><p>No inquiries yet.</p></div>
            ) : (
              inquiries.map(inq => (
                <div
                  key={inq.id}
                  className={`${styles.inqItem} ${activeInquiry?.id === inq.id ? styles.inqItemActive : ''} ${!inq.read ? styles.inqItemUnread : ''}`}
                  onClick={() => setActiveInquiry(inq)}
                >
                  <div className={styles.inqAvatar}>{inq.sender_name.charAt(0).toUpperCase()}</div>
                  <div className={styles.inqInfo}>
                    <div className={styles.inqNameRow}>
                      <span className={styles.inqName}>{inq.sender_name}</span>
                      <span className={styles.inqTime}>{timeAgo(inq.created_at)}</span>
                    </div>
                    <p className={styles.inqPreview}>
                      {inq.content.slice(0, 60)}{inq.content.length > 60 ? '…' : ''}
                    </p>
                    {inq.budget && <span className={styles.inqBudget}>{inq.budget}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DETAIL VIEW */}
          <div className={styles.inqDetail}>
            {activeInquiry ? (
              <div className={styles.detailContent}>
                <div className={styles.detailHeader}>
                  <div className={styles.detailAvatar}>
                    {activeInquiry.sender_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.detailName}>{activeInquiry.sender_name}</div>
                    <div className={styles.detailEmail}>{activeInquiry.sender_email}</div>
                  </div>
                  <span className={styles.detailTime}>{timeAgo(activeInquiry.created_at)}</span>
                </div>
                {activeInquiry.budget && (
                  <div className={styles.detailBudget}>
                    <span className={styles.detailBudgetLabel}>Budget:</span> {activeInquiry.budget}
                  </div>
                )}
                <div className={styles.detailMessage}>{activeInquiry.content}</div>
                <a href={`mailto:${activeInquiry.sender_email}`} className={styles.replyBtn}>
                  Reply via Email →
                </a>
              </div>
            ) : (
              <div className={styles.noDetail}>
                <div className={styles.noDetailIcon}>✉</div>
                <p>Select an inquiry to read it.</p>
              </div>
            )}
          </div>
        </div>

        {/* CONTACT FORM MODAL */}
        {showForm && (
          <div className={styles.overlay} onClick={() => setShowForm(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Send an Inquiry</h2>
                <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
              </div>
              {formSent ? (
                <div className={styles.formSuccess}>
                  <div className={styles.successIcon}>✓</div>
                  <p>Inquiry sent! The bot owner will be in touch.</p>
                </div>
              ) : (
                <form className={styles.form} onSubmit={handleSend}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Bot *</label>
                    <select
                      className={styles.fieldInput}
                      value={form.bot_id}
                      onChange={e => setForm(f => ({ ...f, bot_id: e.target.value }))}
                      required
                    >
                      <option value="">Select bot</option>
                      {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Your Name *</label>
                      <input
                        className={styles.fieldInput}
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Email *</label>
                      <input
                        type="email"
                        className={styles.fieldInput}
                        placeholder="jane@co.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Message *</label>
                    <textarea
                      className={styles.fieldTextarea}
                      rows={4}
                      placeholder="What do you need?"
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Budget</label>
                    <input
                      className={styles.fieldInput}
                      placeholder="e.g. $500/month"
                      value={form.budget}
                      onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    />
                  </div>
                  <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                    {formLoading ? 'Sending...' : 'Send Inquiry →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} onSuccess={() => setShowRegister(false)} />}
    </div>
  )
}
