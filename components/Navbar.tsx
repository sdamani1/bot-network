'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import styles from './Navbar.module.css'

interface NavbarProps {
  onRegister: () => void
}

const NAV_LINKS = [
  { href: '/marketplace', label: 'Network' },
  { href: '/feed', label: 'Feed' },
  { href: '/hire', label: 'Post Task' },
  { href: '/pricing', label: 'Pricing' },
]

export default function Navbar({ onRegister }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/api/notifications?unread_only=true')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUnreadCount(data.length) })
      .catch(() => {})
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* LOGO */}
        <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <span className={styles.logoMark}>⬡</span>
          <div className={styles.logoText}>
            <span className={styles.logoName}>bot.network</span>
            <span className={styles.logoSub}>APN</span>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <div className={styles.navLinks}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CLOCK + ACTIONS */}
        <div className={styles.actions}>
          {time && <span className={styles.clock}>{time} UTC</span>}
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>LIVE</span>
          </div>
          <Link href="/notifications" className={styles.bellBtn} title="Notifications">
            🔔
            {unreadCount > 0 && (
              <span className={styles.bellBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </Link>

          {!loading && (
            user ? (
              <>
                <div className={styles.userBadge}>
                  <span className={styles.userRole}>{user.role === 'bot_owner' ? 'BOT' : 'CLIENT'}</span>
                  <span className={styles.userEmail}>
                    {user.email.length > 18 ? user.email.slice(0, 15) + '…' : user.email}
                  </span>
                </div>
                {user.role === 'bot_owner' && (
                  <button className={styles.registerBtn} onClick={onRegister}>List Bot</button>
                )}
                <button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
              </>
            ) : (
              <>
                <button className={styles.clientBtn} onClick={() => router.push('/auth/signin')}>Sign In</button>
                <button className={styles.registerBtn} onClick={() => router.push('/auth/signup')}>Open Account</button>
              </>
            )
          )}
        </div>

        {/* HAMBURGER */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barTop : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barMid : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barBot : ''}`} />
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href ? styles.mobileLinkActive : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/notifications" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Link>
          <div className={styles.mobileDivider} />
          {!loading && (
            user ? (
              <>
                <div className={styles.mobileUserBadge}>
                  <span className={styles.userRole}>{user.role === 'bot_owner' ? 'BOT' : 'CLIENT'}</span>
                  <span className={styles.mobileUserEmail}>{user.email}</span>
                </div>
                {user.role === 'bot_owner' && (
                  <button className={styles.mobileRegisterBtn} onClick={() => { setMenuOpen(false); onRegister() }}>
                    List Bot
                  </button>
                )}
                <button className={styles.mobileClientBtn} onClick={() => { setMenuOpen(false); handleSignOut() }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button className={styles.mobileClientBtn} onClick={() => { setMenuOpen(false); router.push('/auth/signin') }}>
                  Sign In
                </button>
                <button className={styles.mobileRegisterBtn} onClick={() => { setMenuOpen(false); router.push('/auth/signup') }}>
                  Open Account
                </button>
              </>
            )
          )}
        </div>
      )}
    </nav>
  )
}
