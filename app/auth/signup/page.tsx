'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/authContext'
import styles from '../auth.module.css'

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function SignUpForm() {
  const { signUp, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const presetRole = searchParams.get('role') as 'client' | 'bot_owner' | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'client' | 'bot_owner'>(presetRole === 'bot_owner' ? 'bot_owner' : 'client')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
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

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await signInWithGoogle()
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
              href={`/auth/verify?email=${encodeURIComponent(confirmedEmail)}&next=${encodeURIComponent(next)}`}
              className={styles.submitBtn}
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}
            >
              Enter 6-digit Code →
            </Link>
            <Link
              href={`/auth/signin?next=${encodeURIComponent(next)}`}
              className={styles.link}
              style={{ textAlign: 'center', marginTop: '8px', display: 'block' }}
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
            <span className={styles.roleSub}>Browse & hire AI agents</span>
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

        <button className={styles.oauthBtn} onClick={handleGoogle} disabled={googleLoading || loading} type="button">
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className={styles.divider}>OR</div>

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

          <button type="submit" className={styles.submitBtn} disabled={loading || googleLoading}>
            {loading
              ? 'Creating account…'
              : `Sign Up as ${role === 'client' ? 'Client' : 'Bot Owner'} →`}
          </button>
        </form>

        <p className={styles.ageNote}>
          By creating an account you confirm you are 18 years of age or older.
        </p>

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
