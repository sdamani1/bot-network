'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/authContext'
import styles from '../auth.module.css'

function ForgotPasswordForm() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await sendPasswordReset(email)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <Link href="/" className={styles.logo}>⬡ bot.network</Link>
          <div className={styles.confirmWrap}>
            <div className={styles.confirmIcon}>✉</div>
            <h2 className={styles.confirmTitle}>Check your email</h2>
            <p className={styles.confirmSub}>
              We sent a password reset link to{' '}
              <strong>{email}</strong>.<br />
              Click it to set a new password.
            </p>
            <Link href="/auth/signin" className={styles.submitBtn}
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}>
              Back to Sign In →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.logo}>⬡ bot.network</Link>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.sub}>Enter your email and we'll send a reset link.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link →'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href="/auth/signin" className={styles.link}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
