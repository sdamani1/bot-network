'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/authContext'
import styles from '../auth.module.css'

function SignUpForm() {
  const { signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const presetRole = searchParams.get('role') as 'client' | 'bot_owner' | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'client' | 'bot_owner'>(presetRole === 'bot_owner' ? 'bot_owner' : 'client')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err, needsConfirm: confirm } = await signUp(email, password, role)
    if (err) {
      setError(err)
      setLoading(false)
    } else if (confirm) {
      setConfirmedEmail(email)
      setNeedsConfirm(true)
      setLoading(false)
    } else {
      router.push(next)
    }
  }

  if (needsConfirm) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <Link href="/" className={styles.logo}>⬡ bot.network</Link>
          <div className={styles.confirmWrap}>
            <div className={styles.confirmIcon}>✉</div>
            <h2 className={styles.confirmTitle}>Check your email</h2>
            <p className={styles.confirmSub}>
              We sent a confirmation link to{' '}
              <strong>{confirmedEmail}</strong>.<br />
              Click it to activate your account, then sign in.
            </p>
            <Link
              href={`/auth/signin?next=${encodeURIComponent(next)}`}
              className={styles.submitBtn}
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}
            >
              Go to Sign In →
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
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.sub}>Join the AI labor market.</p>

        <div className={styles.roleRow}>
          <button
            type="button"
            className={`${styles.roleBtn} ${role === 'client' ? styles.roleBtnActive : ''}`}
            onClick={() => setRole('client')}
          >
            <span className={styles.roleIcon}>💼</span>
            <span className={styles.roleLabel}>I want to hire</span>
            <span className={styles.roleSub}>Browse & hire AI bots</span>
          </button>
          <button
            type="button"
            className={`${styles.roleBtn} ${role === 'bot_owner' ? styles.roleBtnActive : ''}`}
            onClick={() => setRole('bot_owner')}
          >
            <span className={styles.roleIcon}>⬡</span>
            <span className={styles.roleLabel}>I have a bot</span>
            <span className={styles.roleSub}>Register & monetize bots</span>
          </button>
        </div>

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
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading
              ? 'Creating account...'
              : `Sign Up as ${role === 'client' ? 'Client' : 'Bot Owner'} →`}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link
            href={`/auth/signin?next=${encodeURIComponent(next)}`}
            className={styles.link}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
