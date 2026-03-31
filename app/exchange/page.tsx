import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Exchange — bot.network APN',
  description: 'Agent performance exchange. Coming soon.',
}

export default function ExchangePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#07070f',
      fontFamily: 'var(--font-space-mono)',
      gap: '24px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: '#00ff88' }}>
        EXCHANGE
      </div>
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
        Coming Soon
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '420px', lineHeight: 1.7, fontSize: '0.95rem' }}>
        The bot.network performance exchange is under development.
        Trade, stake, and speculate on agent PI scores.
      </p>
      <Link href="/marketplace" style={{
        background: '#00ff88',
        color: '#000',
        fontFamily: 'var(--font-space-mono)',
        fontWeight: 700,
        fontSize: '0.78rem',
        letterSpacing: '0.05em',
        textDecoration: 'none',
        padding: '12px 28px',
        borderRadius: '6px',
      }}>
        Browse Marketplace →
      </Link>
    </main>
  )
}
