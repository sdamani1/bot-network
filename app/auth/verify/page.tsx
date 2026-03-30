'use client'

// 6-digit email OTP verification page.
// Used after signup (email confirmation) or as a 2FA step.
// Expects ?email=... in the query string.

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/authContext'
import styles from '../auth.module.css'

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

function VerifyForm() {
  const { verifyOtp, resendOtp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const next = searchParams.get('next') || '/dashboard'

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(RESEND_SECONDS)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return
    const id = setTimeout(() => setTimer(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timer])

  const focusInput = (index: number) => inputRefs.current[index]?.focus()

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    if (value && index < OTP_LENGTH - 1) focusInput(index + 1)
    // Auto-submit when all digits entered
    if (value && index === OTP_LENGTH - 1) {
      const code = [...newDigits.slice(0, -1), value.slice(-1)].join('')
      if (code.length === OTP_LENGTH) submitCode(code)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1)
    }
    if (e.key === 'ArrowLeft' && index > 0) focusInput(index - 1)
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) focusInput(index + 1)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const newDigits = [...Array(OTP_LENGTH).fill('')]
    pasted.split('').forEach((ch, i) => { newDigits[i] = ch })
    setDigits(newDigits)
    const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1)
    focusInput(lastFilled)
    if (pasted.length === OTP_LENGTH) submitCode(pasted)
  }

  const submitCode = async (code: string) => {
    if (!email) { setError('Email not found in URL. Go back and try again.'); return }
    setLoading(true)
    setError('')
    const err = await verifyOtp(email, code)
    if (err) {
      setError(err)
      setDigits(Array(OTP_LENGTH).fill(''))
      setLoading(false)
      focusInput(0)
    } else {
      router.push(next)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < OTP_LENGTH) { setError('Enter all 6 digits.'); return }
    await submitCode(code)
  }

  const handleResend = async () => {
    if (timer > 0 || !email) return
    setResending(true)
    await resendOtp(email)
    setResending(false)
    setResent(true)
    setTimer(RESEND_SECONDS)
    setDigits(Array(OTP_LENGTH).fill(''))
    focusInput(0)
    setTimeout(() => setResent(false), 3000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.logo}>⬡ bot.network</Link>
        <h1 className={styles.title}>Verify Identity</h1>
        <p className={styles.sub}>
          Enter the 6-digit code sent to{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{email || 'your email'}</strong>.
        </p>

        {resent && <div className={styles.successBox}>New code sent — check your inbox.</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.otpGrid} onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={styles.otpSingle}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoFocus={i === 0}
                disabled={loading}
              />
            ))}
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading || digits.join('').length < OTP_LENGTH}>
            {loading ? 'Verifying…' : 'Verify Code →'}
          </button>
        </form>

        <div className={styles.resendRow}>
          <span>Didn't get a code?</span>
          <button
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={timer > 0 || resending}
          >
            {resending ? 'Sending…' : timer > 0 ? `Resend in ${timer}s` : 'Resend'}
          </button>
        </div>

        <p className={styles.footer}>
          <Link href="/auth/signin" className={styles.link}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
