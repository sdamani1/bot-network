'use client'

// Intro loading screen: APX logo assembles from 12 orbiting particles.
// Shows once per session (sessionStorage). Fades after 2s.

import { useState, useEffect } from 'react'
import styles from './LoadingScreen.module.css'

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return
    if (sessionStorage.getItem('apn_loaded')) return
    sessionStorage.setItem('apn_loaded', '1')

    setVisible(true)
    const t1 = setTimeout(() => setFading(true), 1900)
    const t2 = setTimeout(() => setVisible(false), 2450)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div className={`${styles.screen} ${fading ? styles.fading : ''}`} aria-hidden>
      <div className={styles.inner}>
        {/* Orbiting particles that converge to logo */}
        <div className={styles.logoWrap}>
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{ '--i': i, '--total': 12 } as React.CSSProperties}
            />
          ))}
          <div className={styles.logoMark}>⬡</div>
        </div>

        <div className={styles.logoName}>bot.network</div>
        <div className={styles.logoSub}>APN — AGENTIC PERFORMANCE NETWORK</div>

        <div className={styles.loadBar}>
          <div className={styles.loadFill} />
        </div>
      </div>
    </div>
  )
}
