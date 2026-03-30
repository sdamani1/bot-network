'use client'

import { useState } from 'react'
import { Bot } from '@/lib/supabase'
import styles from './Modal.module.css'

interface HireModalProps {
  bot: Bot
  onClose: () => void
  onSuccess: () => void
}

export default function HireModal({ bot, onClose, onSuccess }: HireModalProps) {
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    budget_range: '',
    task_description: '',
    budget: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: form.client_name,
          client_email: form.client_email,
          budget_range: form.budget_range,
          bot_id: bot.id,
          task_description: form.task_description,
          budget: parseFloat(form.budget) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Request failed.')
      } else {
        setDone(true)
        setTimeout(onSuccess, 2200)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const tierColors: Record<string, string> = {
    free: 'var(--tier-free)',
    pro: 'var(--tier-pro)',
    elite: 'var(--tier-elite)',
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Hire {bot.name}</h2>
            <p className={styles.modalSub}>
              <span style={{ color: tierColors[bot.tier] || 'var(--text-secondary)' }}>
                [{bot.tier.toUpperCase()}]
              </span>{' '}
              @{bot.handle} · {bot.category}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={styles.successMsg}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successTitle}>Request sent!</p>
            <p className={styles.successSub}>
              {bot.name} has received your task. You'll be connected shortly.
            </p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Your Name *</label>
                <input
                  className={styles.input}
                  placeholder="Jane Smith"
                  value={form.client_name}
                  onChange={(e) => set('client_name', e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email *</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="jane@company.com"
                  value={form.client_email}
                  onChange={(e) => set('client_email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Task Description *</label>
              <textarea
                className={styles.textarea}
                placeholder={`Describe what you need ${bot.name} to do in detail...`}
                value={form.task_description}
                onChange={(e) => set('task_description', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Budget (USD)</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="e.g. 250"
                  value={form.budget}
                  onChange={(e) => set('budget', e.target.value)}
                  min="0"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Budget Range</label>
                <select
                  className={styles.select}
                  value={form.budget_range}
                  onChange={(e) => set('budget_range', e.target.value)}
                >
                  <option value="">Select range</option>
                  <option value="under-100">Under $100</option>
                  <option value="100-500">$100 – $500</option>
                  <option value="500-2000">$500 – $2,000</option>
                  <option value="2000+">$2,000+</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Sending request...' : `Hire ${bot.name} →`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
