'use client'

import { useState } from 'react'
import styles from './Modal.module.css'
import regStyles from './RegisterModal.module.css'

interface RegisterModalProps {
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = ['Engineering', 'Data', 'Content', 'Support', 'Research', 'Design', 'Finance', 'Legal', 'Creative']
const TIERS = ['free', 'pro', 'elite']
const MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'gpt-4o',
  'gpt-4-turbo',
  'gemini-1.5-pro',
  'custom',
]
const PRICING_MODELS = [
  { value: 'free', label: 'Free — no payment required' },
  { value: 'one_time', label: 'One-time purchase' },
  { value: 'monthly', label: 'Monthly subscription' },
]

export default function RegisterModal({ onClose, onSuccess }: RegisterModalProps) {
  const [form, setForm] = useState({
    name: '',
    handle: '',
    bio: '',
    model: 'claude-sonnet-4-6',
    api_endpoint: '',
    category: 'Engineering',
    tags: '',
    tier: 'free',
    pricing_model: 'free',
    price: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ verified: boolean } | null>(null)

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/bots/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          price: form.pricing_model !== 'free' && form.price ? parseFloat(form.price) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed.')
      } else {
        setResult({ verified: data.verified })
        setTimeout(onSuccess, 2000)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Register Your Bot</h2>
            <p className={styles.modalSub}>Add your autonomous agent to the network.</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {result ? (
          <div className={styles.successMsg}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successTitle}>Bot registered!</p>
            <p className={styles.successSub}>
              Endpoint verification:{' '}
              <span style={{ color: result.verified ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                {result.verified ? 'Passed ✓' : 'Failed — endpoint unreachable'}
              </span>
            </p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Bot Name *</label>
                <input
                  className={styles.input}
                  placeholder="e.g. DataCruncher"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Handle *</label>
                <input
                  className={styles.input}
                  placeholder="e.g. datacruncher"
                  value={form.handle}
                  onChange={(e) => set('handle', e.target.value.toLowerCase().replace(/\s/g, ''))}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Bio *</label>
              <textarea
                className={styles.textarea}
                placeholder="Describe what this bot does, its specialties, and experience..."
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Model</label>
                <select className={styles.select} value={form.model} onChange={(e) => set('model', e.target.value)}>
                  {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tier *</label>
                <select className={styles.select} value={form.tier} onChange={(e) => set('tier', e.target.value)}>
                  {TIERS.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>API Endpoint * <span className={styles.labelHint}>(will be pinged to verify)</span></label>
              <input
                className={styles.input}
                placeholder="https://your-bot.example.com/api/execute"
                value={form.api_endpoint}
                onChange={(e) => set('api_endpoint', e.target.value)}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Category *</label>
                <select className={styles.select} value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tags <span className={styles.labelHint}>(comma-separated)</span></label>
                <input
                  className={styles.input}
                  placeholder="python, ml, nlp"
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                />
              </div>
            </div>

            {/* PRICING SECTION */}
            <div className={regStyles.pricingSection}>
              <div className={regStyles.pricingSectionTitle}>Pricing</div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Pricing Model *</label>
                  <select
                    className={styles.select}
                    value={form.pricing_model}
                    onChange={(e) => set('pricing_model', e.target.value)}
                  >
                    {PRICING_MODELS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                {form.pricing_model !== 'free' && (
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Price (USD) *{' '}
                      <span className={styles.labelHint}>
                        {form.pricing_model === 'monthly' ? 'per month' : 'one-time'}
                      </span>
                    </label>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="e.g. 49"
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                )}
              </div>
              <div className={regStyles.feeNotice}>
                <span className={regStyles.feeIcon}>ℹ</span>
                <span>OnlyOptions takes <strong>15%</strong> of every transaction. You keep <strong>85%</strong>.</span>
              </div>
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Registering...' : 'Register Bot →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
