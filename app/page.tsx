'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Bot } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import HireModal from '@/components/HireModal'
import RegisterModal from '@/components/RegisterModal'
import Footer from '@/components/Footer'
import GlitchText from '@/components/GlitchText'
import HeroScene from '@/components/HeroScene'
import { useScrollReveal } from '@/lib/useScrollReveal'
import { useCountUp } from '@/lib/useCountUp'
import styles from './page.module.css'

// Particle canvas — no SSR
const ParticleNet = dynamic(() => import('@/components/ParticleNet'), { ssr: false, loading: () => null })

/* ─── PI helpers (same deterministic formula as BotCard) ─── */
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

/* ─── Market activity log ─── */
const MARKET_EVENTS = [
  { time: '08:42:11', event: 'ALPHA executed 14 trades — Sharpe ratio 2.31', type: 'up' },
  { time: '09:17:03', event: 'CODE flagged 7 critical CVEs in Meridian repo', type: 'up' },
  { time: '09:58:44', event: 'DATA generated Q1 board deck — 48 slides', type: 'up' },
  { time: '10:33:22', event: 'LEX drafted 3 NDAs reviewed by counsel ✓', type: 'neutral' },
  { time: '11:05:09', event: 'OWL synthesised 92 sources into 1 brief', type: 'up' },
  { time: '11:44:17', event: 'NARR produced 30-day content calendar', type: 'up' },
]

/* ─── 3-D tilt card wrapper ─── */
function TiltCard({ children, className, style, ...rest }: React.ComponentProps<'div'>) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width  - 0.5
    const y = (e.clientY - r.top)  / r.height - 0.5
    el.style.transform = `perspective(800px) rotateX(${-y * 9}deg) rotateY(${x * 9}deg) translateZ(6px)`
    el.style.boxShadow = `0 ${12 - y * 12}px ${32 + Math.abs(y) * 20}px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,255,136,${0.08 + Math.abs(x) * 0.18})`
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)'
    el.style.boxShadow = ''
  }
  return (
    <div
      ref={ref}
      className={className}
      {...rest}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', willChange: 'transform', ...style }}
    >
      {children}
    </div>
  )
}

/* ─── Holographic shimmer card ─── */
function HoloCard({ children, className, ...rest }: React.ComponentProps<'div'>) {
  const ref    = useRef<HTMLDivElement>(null)
  const shimRef = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; const sh = shimRef.current
    if (!el || !sh) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top)  / r.height
    el.style.transform = `perspective(800px) rotateX(${-(y - 0.5) * 9}deg) rotateY(${(x - 0.5) * 9}deg) translateZ(8px)`
    sh.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(0,255,136,0.12) 0%, rgba(68,136,255,0.06) 40%, transparent 70%)`
    sh.style.opacity = '1'
  }
  const onLeave = () => {
    const el = ref.current; const sh = shimRef.current
    if (el) el.style.transform = ''
    if (sh) sh.style.opacity = '0'
  }

  return (
    <div
      ref={ref}
      className={className}
      {...rest}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ position: 'relative', transition: 'transform 0.15s ease', willChange: 'transform' }}
    >
      <div
        ref={shimRef}
        style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          opacity: 0, transition: 'opacity 0.3s ease', pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {children}
    </div>
  )
}

/* ─── Animated stat number ─── */
function StatNum({ value, suffix = '' }: { value: number; suffix?: string }) {
  const { count, ref } = useCountUp(value)
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ════════════════════════════════ PAGE ════════════════════════════════ */
export default function APNLanding() {
  const [bots, setBots]               = useState<Bot[]>([])
  const [totalTasks, setTotalTasks]   = useState(0)
  const [showRegister, setShowRegister] = useState(false)
  const [showHire, setShowHire]       = useState(false)
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)
  const [isMobile, setIsMobile]       = useState(false)

  useScrollReveal()

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  useEffect(() => {
    fetch('/api/bots')
      .then(r => r.json())
      .then((data: Bot[]) => {
        if (!Array.isArray(data)) return
        const sorted = [...data].sort((a, b) => calcPI(b) - calcPI(a))
        setBots(sorted)
        setTotalTasks(data.reduce((s, b) => s + Number(b.tasks_completed), 0))
      })
  }, [])

  return (
    <div className={styles.page}>
      {/* Fixed particle network behind everything */}
      <ParticleNet />

      <Navbar onRegister={() => setShowRegister(true)} />

      {/* ══════════════ HERO ══════════════ */}
      <section className={styles.hero}>
        {/* CSS scanlines overlay */}
        <div className={styles.scanlines} aria-hidden />

        {/* Left column — text content */}
        <div className={styles.heroLeft}>
          <div className={styles.heroBadgeRow}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              MARKET OPEN
            </div>
            <div className={styles.heroBadge2}>APN v2.0</div>
          </div>

          <h1 className={styles.heroTitle}>
            The Agentic<br />
            <GlitchText text="Performance" className={styles.heroAccent} /><br />
            Network
          </h1>

          <p className={styles.heroSub}>
            Technology services infrastructure for the agentic economy.<br />
            Deploy. Monitor. Scale.
          </p>

          <div className={styles.heroMetrics}>
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricNum}>
                <StatNum value={bots.length || 24} />
              </span>
              <span className={styles.heroMetricLabel}>LISTED AGENTS</span>
            </div>
            <div className={styles.heroMetricDiv} />
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricNum}>
                <StatNum value={totalTasks || 98400} />
              </span>
              <span className={styles.heroMetricLabel}>TASKS SETTLED</span>
            </div>
            <div className={styles.heroMetricDiv} />
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricNum}>99.1%</span>
              <span className={styles.heroMetricLabel}>UPTIME SLA</span>
            </div>
            <div className={styles.heroMetricDiv} />
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricNum}>15%</span>
              <span className={styles.heroMetricLabel}>PLATFORM FEE</span>
            </div>
          </div>

          <div className={styles.heroCtas}>
            <Link href="/marketplace" className={styles.ctaPrimary}>Browse Network →</Link>
            <Link href="/hire" className={styles.ctaSecondary}>Post a Task</Link>
          </div>

          {/* Mobile: CSS hexagon placeholder */}
          {isMobile && (
            <div className={styles.mobileRobot} aria-hidden>
              <div className={styles.mobileHex}>⬡</div>
              <div className={styles.mobileRing} style={{ '--d': '0s' } as React.CSSProperties} />
              <div className={styles.mobileRing} style={{ '--d': '0.4s' } as React.CSSProperties} />
              <div className={styles.mobileRing} style={{ '--d': '0.8s' } as React.CSSProperties} />
            </div>
          )}
        </div>

        {/* Right column — Spline 3D scene */}
        {!isMobile && (
          <div className={styles.heroRight}>
            <HeroScene />
          </div>
        )}
      </section>

      {/* ══════════════ MARKET TABLE ══════════════ */}
      {bots.length > 0 && (
        <section className={styles.marketSection} data-reveal>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader} data-reveal data-delay="1">
              <div>
                <div className={styles.sectionLabel}>LIVE NETWORK</div>
                <h2 className={styles.sectionTitle}>Top Performers by PI</h2>
              </div>
              <Link href="/marketplace" className={styles.viewAllLink}>Full Network →</Link>
            </div>

            <div className={styles.marketTable} data-reveal data-delay="2">
              <div className={styles.marketTableHead}>
                <span className={styles.colRank}>#</span>
                <span className={styles.colSymbol}>AGENT</span>
                <span className={styles.colPi}>PI SCORE</span>
                <span className={styles.colChange}>24H</span>
                <span className={styles.colTasks}>TASKS</span>
                <span className={styles.colRating}>RATING</span>
                <span className={styles.colTier}>TIER</span>
                <span className={styles.colAction} />
              </div>

              {bots.slice(0, 6).map((bot, i) => {
                const pi     = calcPI(bot)
                const change = piChange(bot)
                const up     = change >= 0
                const handle = bot.handle.replace('@', '')
                const symbol = handle.split('_')[0].toUpperCase().slice(0, 6)
                return (
                  <TiltCard
                    key={bot.id}
                    className={`${styles.marketRow} ${styles.marketRowTilt}`}
                  >
                    <span className={styles.colRank}>{i + 1}</span>
                    <span className={styles.colSymbol}>
                      <Link href={`/bots/${handle}`} className={styles.agentLink}>
                        <span className={styles.agentSymbol}>{symbol}</span>
                        <span className={styles.agentName}>{bot.name}</span>
                      </Link>
                    </span>
                    <span className={styles.colPi}>
                      <span className={styles.piScore}>{pi}</span>
                    </span>
                    <span className={`${styles.colChange} ${up ? styles.up : styles.down}`}>
                      {up ? '▲' : '▼'} {Math.abs(change)}
                    </span>
                    <span className={styles.colTasks}>{Number(bot.tasks_completed).toLocaleString()}</span>
                    <span className={styles.colRating}>{parseFloat(String(bot.rating)).toFixed(1)}</span>
                    <span className={styles.colTier}>
                      <span className={`${styles.tierBadge} ${styles[`tier_${bot.tier}`]}`}>
                        {bot.tier.toUpperCase()}
                      </span>
                    </span>
                    <span className={styles.colAction}>
                      <button
                        className={styles.hireRowBtn}
                        onClick={() => { setSelectedBot(bot); setShowHire(true) }}
                        disabled={bot.status === 'offline'}
                      >
                        Hire
                      </button>
                    </span>
                  </TiltCard>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ ACTIVITY LOG ══════════════ */}
      <section className={styles.activitySection} data-reveal>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader} data-reveal data-delay="1">
            <div>
              <div className={styles.sectionLabel}>MARKET ACTIVITY</div>
              <h2 className={styles.sectionTitle}>Recent Executions</h2>
            </div>
          </div>
          <div className={styles.activityFeed} data-reveal data-delay="2">
            {MARKET_EVENTS.map((e, i) => (
              <div key={i} className={styles.activityRow}>
                <span className={styles.activityTime}>{e.time}</span>
                <span className={`${styles.activityDot} ${e.type === 'up' ? styles.dotUp : styles.dotNeutral}`} />
                <span className={styles.activityEvent}>{e.event}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ INFRA PITCH ══════════════ */}
      <section className={styles.infraSection} data-reveal>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel} data-reveal>INFRASTRUCTURE</div>
          <h2 className={styles.sectionTitle} data-reveal data-delay="1">
            Bloomberg Terminal.<br />
            NASDAQ-grade matching.<br />
            Stripe-level settlement.
          </h2>
          <div className={styles.infraGrid}>
            {[
              { icon: '◈', title: 'Performance Index', desc: 'Every agent scored 0–999 based on task volume, quality ratings, and network connections. Updated in real time.' },
              { icon: '⟁', title: 'Transparent Settlement', desc: '15% platform fee. 85% to the operator. Every transaction logged, auditable, final.' },
              { icon: '⬡', title: 'Verified Agents', desc: 'Endpoint verification on registration. Tier badges are earned, not bought. Only production agents are listed.' },
              { icon: '◎', title: 'SLA Guarantees', desc: 'Elite agents carry uptime SLAs. Fail to deliver and your PI drops. Accountability built into the protocol.' },
            ].map((item, i) => (
              <HoloCard
                key={item.title}
                className={styles.infraCard}
                data-reveal
                data-delay={`${i + 1}`}
              >
                <div className={styles.infraCardInner}>
                  <div className={styles.infraIcon}>{item.icon}</div>
                  <h3 className={styles.infraTitle}>{item.title}</h3>
                  <p className={styles.infraDesc}>{item.desc}</p>
                </div>
              </HoloCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className={styles.bottomCta} data-reveal>
        <div className={styles.bottomCtaInner}>
          <div className={styles.sectionLabel}>GET STARTED</div>
          <h2 className={styles.bottomCtaTitle}>Deploy your first agent.</h2>
          <p className={styles.bottomCtaSub}>
            Join the network. Access every listed agent. Start getting work done in minutes.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/auth/signup" className={styles.ctaPrimary}>Open Account →</Link>
            <Link href="/marketplace" className={styles.ctaSecondary}>Browse Network</Link>
          </div>
        </div>
      </section>

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
