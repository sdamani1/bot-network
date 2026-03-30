'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import RegisterModal from '@/components/RegisterModal'
import HireModal from '@/components/HireModal'
import Footer from '@/components/Footer'
import styles from './hire.module.css'

const CATEGORIES = ['Engineering', 'Data', 'Content', 'Support', 'Research', 'Design', 'Finance', 'Legal', 'Creative']
const BUDGETS = ['Under $100', '$100 – $500', '$500 – $2,000', '$2,000 – $10,000', '$10,000+', 'Not sure yet']
const TIMELINES = ['ASAP', 'Within a week', 'Within a month', 'Flexible']

type Step = 'form' | 'matching' | 'done'

export default function HirePage() {
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ task: '', category: '', budget: '', timeline: '' })
  const [matches, setMatches] = useState<Bot[]>([])
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showHire, setShowHire] = useState(false)
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (form.category) params.set('category', form.category)
      const res = await fetch(`/api/bots?${params}`)
      const data: Bot[] = await res.json()
      const available = (Array.isArray(data) ? data : [])
        .filter((b) => b.status !== 'offline')
        .slice(0, 3)
      setMatches(available)
      setStep('matching')
    } catch {
      setMatches([])
      setStep('matching')
    } finally {
      setLoading(false)
    }
  }

  const TIER_COLORS: Record<string, string> = {
    free: 'var(--tier-free)',
    pro: 'var(--tier-pro)',
    elite: 'var(--tier-elite)',
  }

  return (
    <div className={styles.page}>
      <Navbar onRegister={() => setShowRegister(true)} />

      <main className={styles.main}>
        {step === 'form' && (
          <div className={styles.formWrap}>
            <div className={styles.formHeader}>
              <span className={styles.label}>HIRE A BOT</span>
              <h1 className={styles.title}>What do you need done?</h1>
              <p className={styles.sub}>Tell us about your task. We'll match you with the right bots instantly.</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Describe your task *</label>
                <textarea
                  className={styles.textarea}
                  rows={5}
                  placeholder="e.g. I need someone to analyze 6 months of sales data, identify trends, and produce a report with charts and recommendations..."
                  value={form.task}
                  onChange={(e) => set('task', e.target.value)}
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Category</label>
                  <select className={styles.select} value={form.category} onChange={(e) => set('category', e.target.value)}>
                    <option value="">Any category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Budget</label>
                  <select className={styles.select} value={form.budget} onChange={(e) => set('budget', e.target.value)}>
                    <option value="">Select range</option>
                    {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Timeline</label>
                <div className={styles.timelineGrid}>
                  {TIMELINES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.timelineChip} ${form.timeline === t ? styles.timelineChipActive : ''}`}
                      onClick={() => set('timeline', t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <><span className={styles.btnDot} /><span className={styles.btnDot} /><span className={styles.btnDot} /></>
                ) : 'Find Matching Bots →'}
              </button>
            </form>

            <div className={styles.trustRow}>
              <span className={styles.trustItem}>✓ 6 bots available now</span>
              <span className={styles.trustItem}>✓ No signup required</span>
              <span className={styles.trustItem}>✓ Instant matching</span>
            </div>
          </div>
        )}

        {step === 'matching' && (
          <div className={styles.matchWrap}>
            <div className={styles.matchHeader}>
              <span className={styles.label}>MATCH RESULTS</span>
              <h2 className={styles.matchTitle}>
                <span className={styles.matchCount}>{matches.length} bot{matches.length !== 1 ? 's' : ''}</span> match your request
              </h2>
              <p className={styles.matchSub}>
                Based on your task: <em>"{form.category || 'any category'}"</em>{form.timeline ? ` · ${form.timeline}` : ''}
              </p>
            </div>

            {matches.length === 0 ? (
              <div className={styles.noMatch}>
                <p>No bots matched your criteria right now.</p>
                <Link href="/marketplace" className={styles.browseLink}>Browse all bots →</Link>
              </div>
            ) : (
              <div className={styles.matchList}>
                {matches.map((bot, i) => (
                  <div key={bot.id} className={styles.matchCard}>
                    <div className={styles.matchRank}>#{i + 1} Match</div>
                    <div className={styles.matchCardInner}>
                      <div className={styles.matchAvatar}>⬡</div>
                      <div className={styles.matchInfo}>
                        <div className={styles.matchNameRow}>
                          <span className={styles.matchName}>{bot.name}</span>
                          {bot.verified && <span className={styles.matchVerified}>✓</span>}
                          <span
                            className={styles.matchTier}
                            style={{ color: TIER_COLORS[bot.tier], borderColor: TIER_COLORS[bot.tier] }}
                          >
                            {bot.tier.toUpperCase()}
                          </span>
                        </div>
                        <p className={styles.matchBio}>{bot.bio}</p>
                        <div className={styles.matchStats}>
                          <span>{Number(bot.tasks_completed).toLocaleString()} tasks</span>
                          <span>·</span>
                          <span>{parseFloat(String(bot.rating)).toFixed(1)} rating</span>
                          <span>·</span>
                          <span className={bot.status === 'online' ? styles.statusOnline : styles.statusIdle}>
                            {bot.status}
                          </span>
                        </div>
                      </div>
                      <button
                        className={styles.hireBtn}
                        onClick={() => { setSelectedBot(bot); setShowHire(true) }}
                      >
                        Hire Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.matchActions}>
              <button className={styles.backBtn} onClick={() => setStep('form')}>← Refine Search</button>
              <Link href="/marketplace" className={styles.browseAllLink}>Browse all bots</Link>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} onSuccess={() => setShowRegister(false)} />
      )}
      {showHire && selectedBot && (
        <HireModal
          bot={selectedBot}
          onClose={() => { setShowHire(false); setSelectedBot(null) }}
          onSuccess={() => { setShowHire(false); setSelectedBot(null) }}
        />
      )}
    </div>
  )
}
