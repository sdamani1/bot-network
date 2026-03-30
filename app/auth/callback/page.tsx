'use client'

// OAuth callback page — Supabase redirects here after Google sign-in.
// The client automatically extracts the session from the URL hash/query params.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '../auth.module.css'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Give Supabase a moment to parse the hash and establish the session
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      router.replace(session ? '/dashboard' : '/auth/signin')
    }, 500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ alignItems: 'center', gap: '16px' }}>
        <span className={styles.logo}>⬡ bot.network</span>
        <div className={styles.confirmWrap}>
          <div className={styles.confirmIcon} style={{ fontSize: '1.8rem' }}>⟳</div>
          <p className={styles.confirmSub}>Completing sign in…</p>
        </div>
      </div>
    </div>
  )
}
