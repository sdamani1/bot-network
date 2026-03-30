'use client'

// Pure CSS/SVG animated robot hero — no Three.js.
// Flat vector sci-fi style. Fixed right side of viewport.
// Scroll: gentle rotation. Hides after hero leaves viewport.

import { useEffect, useRef } from 'react'
import styles from './RobotHero.module.css'

export default function RobotHero() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onScroll = () => {
      const scrollY = window.scrollY
      const heroH   = window.innerHeight

      if (scrollY >= heroH) {
        if (el.style.display !== 'none') el.style.display = 'none'
        return
      }
      if (el.style.display === 'none') el.style.display = ''
      el.style.transform = `translateY(-50%) rotate(${scrollY * 0.1}deg)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ─── colours ─── */
  const silver   = '#c8c8d8'
  const silver2  = '#b0b0c0'
  const silver3  = '#a0a0b0'
  const darkPanel = '#1a1a2e'
  const joint    = '#808090'
  const sidePanel = '#b8b8cc'
  const ventLine = '#707088'
  const red      = '#ff0000'
  const redDim   = '#ff2200'

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Spotlight behind robot */}
      <div className={styles.spotlight} />

      {/*
        viewBox 0 0 280 420
        overflow visible so platform ellipses can extend below
      */}
      <svg
        viewBox="0 0 280 420"
        width="280"
        height="420"
        className={styles.robot}
        aria-hidden
        style={{ overflow: 'visible' }}
      >

        {/* ── PLATFORM rings (bottom, behind everything) ── */}
        <g className={styles.platformGroup}>
          <ellipse cx="140" cy="415" rx="88" ry="11"
            fill="none" stroke={redDim} strokeWidth="2" />
          <ellipse cx="140" cy="415" rx="118" ry="15"
            fill="none" stroke={redDim} strokeWidth="1" opacity="0.35" />
        </g>

        {/* ── LEGS — left ── */}
        {/* upper leg */}
        <rect x="84" y="236" width="40" height="76" rx="8" fill={silver} />
        {/* knee joint */}
        <circle cx="104" cy="316" r="16" fill={joint} stroke={silver2} strokeWidth="1" />
        {/* lower leg */}
        <rect x="86" y="328" width="36" height="66" rx="8" fill={silver} />
        {/* foot */}
        <rect x="72" y="392" width="52" height="20" rx="6" fill={silver3} />

        {/* ── LEGS — right ── */}
        <rect x="156" y="236" width="40" height="76" rx="8" fill={silver} />
        <circle cx="176" cy="316" r="16" fill={joint} stroke={silver2} strokeWidth="1" />
        <rect x="158" y="328" width="36" height="66" rx="8" fill={silver} />
        <rect x="156" y="392" width="52" height="20" rx="6" fill={silver3} />

        {/* ── HIP CONNECTOR ── */}
        <rect x="80" y="219" width="120" height="17" rx="4" fill={silver2} />

        {/* ── ARMS — left (rendered before torso; torso edge covers tops) ── */}
        {/* upper arm */}
        <rect x="45" y="136" width="30" height="72" rx="10" fill={silver} />
        {/* lower arm */}
        <rect x="47" y="208" width="26" height="62" rx="8" fill={silver2} />
        {/* hand */}
        <rect x="46" y="270" width="28" height="30" rx="8" fill={silver} />

        {/* ── ARMS — right ── */}
        <rect x="205" y="136" width="30" height="72" rx="10" fill={silver} />
        <rect x="207" y="208" width="26" height="62" rx="8" fill={silver2} />
        <rect x="206" y="270" width="28" height="30" rx="8" fill={silver} />

        {/* ── TORSO GROUP (breathing animation) ── */}
        <g className={styles.torsoGroup}>
          {/* main torso shell */}
          <rect x="60" y="100" width="160" height="119" rx="8" fill={silver} />

          {/* side panels */}
          <rect x="64" y="118" width="24" height="62" rx="4" fill={sidePanel} />
          <rect x="192" y="118" width="24" height="62" rx="4" fill={sidePanel} />
          {/* vent lines on side panels */}
          <line x1="68" y1="130" x2="84" y2="130" stroke={ventLine} strokeWidth="1" />
          <line x1="68" y1="139" x2="84" y2="139" stroke={ventLine} strokeWidth="1" />
          <line x1="68" y1="148" x2="84" y2="148" stroke={ventLine} strokeWidth="1" />
          <line x1="196" y1="130" x2="212" y2="130" stroke={ventLine} strokeWidth="1" />
          <line x1="196" y1="139" x2="212" y2="139" stroke={ventLine} strokeWidth="1" />
          <line x1="196" y1="148" x2="212" y2="148" stroke={ventLine} strokeWidth="1" />

          {/* dark chest panel */}
          <rect x="100" y="115" width="80" height="52" rx="4"
            fill={darkPanel} stroke="#3a3a5a" strokeWidth="0.5" />
          {/* red accent lines on chest */}
          <line x1="113" y1="131" x2="167" y2="131" stroke={red} strokeWidth="1.5" opacity="0.75" />
          <line x1="113" y1="141" x2="167" y2="141" stroke={red} strokeWidth="1"   opacity="0.42" />
          <line x1="113" y1="151" x2="167" y2="151" stroke={red} strokeWidth="0.8" opacity="0.22" />

          {/* small corner accent dots */}
          <circle cx="106" cy="120" r="2.5" fill={red} opacity="0.6" />
          <circle cx="174" cy="120" r="2.5" fill={red} opacity="0.6" />
        </g>

        {/* ── SHOULDER JOINTS (on top of torso/arms) ── */}
        <circle cx="60"  cy="125" r="16" fill="#909098" stroke={silver2} strokeWidth="1" />
        <circle cx="220" cy="125" r="16" fill="#909098" stroke={silver2} strokeWidth="1" />

        {/* ── NECK ── */}
        <rect x="130" y="87" width="20" height="13" rx="3" fill={silver2} />

        {/* ── HEAD GROUP (head-scan animation) ── */}
        <g className={styles.head}>
          {/* main head shell */}
          <rect x="90" y="12" width="100" height="75" rx="12" fill={silver} />

          {/* crown detail strip */}
          <rect x="118" y="12" width="44" height="7" rx="3" fill={sidePanel} />

          {/* side ear/sensor nubs */}
          <rect x="90"  y="30" width="5" height="20" rx="2.5" fill={joint} />
          <rect x="185" y="30" width="5" height="20" rx="2.5" fill={joint} />

          {/* dark faceplate */}
          <rect x="98" y="26" width="84" height="48" rx="7" fill={darkPanel} />

          {/* eye slots — animated */}
          <rect className={styles.eye}
            x="106" y="40" width="28" height="10" rx="5" fill={red} />
          <rect className={styles.eye}
            x="146" y="40" width="28" height="10" rx="5" fill={red} />

          {/* nose bridge detail */}
          <rect x="136" y="54" width="8" height="12" rx="3" fill="#2a2a44" />

          {/* chin plate */}
          <rect x="116" y="70" width="48" height="9" rx="4" fill={silver2} />
        </g>

      </svg>
    </div>
  )
}
