'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import styles from './Navbar.module.css'

interface NavbarProps {
  onRegister?: () => void
}

const NAV_LINKS = [
  { href: '/marketplace', label: 'Network' },
  { href: '/feed', label: 'Feed' },
  { href: '/hire', label: 'Post Task' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/sales', label: 'Talk to Sales' },
]

function getInitials(email: string, fullName?: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export default function Navbar({ onRegister }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [time, setTime] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // UTC clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Notifications badge
  useEffect(() => {
    fetch('/api/notifications?unread_only=true')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUnreadCount(data.length) })
      .catch(() => {})
  }, [])

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await signOut()
    router.push('/')
  }

  const avatarUrl = profile?.avatar_url ?? user?.avatar_url ?? null
  const fullName = profile?.full_name ?? user?.full_name ?? null
  const initials = user ? getInitials(user.email, fullName) : ''

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
                {user.role === 'bot_owner' && onRegister && (
                  <button className={styles.registerBtn} onClick={onRegister}>List Bot</button>
                )}

                {/* AVATAR DROPDOWN */}
                <div className={styles.avatarWrap} ref={dropdownRef}>
                  <button
                    className={styles.avatarBtn}
                    onClick={() => setDropdownOpen(o => !o)}
                    aria-label="Account menu"
                    aria-expanded={dropdownOpen}
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className={styles.avatarImg} referrerPolicy="no-referrer" />
                    ) : (
                      <span className={styles.avatarInitials}>{initials}</span>
                    )}
                    <span className={styles.avatarRoleChip}>
                      {user.role === 'bot_owner' ? 'BOT' : 'CLIENT'}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <span className={styles.dropdownName}>{fullName || 'Account'}</span>
                        <span className={styles.dropdownEmail}>{user.email}</span>
                      </div>
                      <div className={styles.dropdownDivider} />
                      <Link href="/dashboard" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                        Dashboard
                      </Link>
                      <Link href="/inbox" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                        Inbox
                      </Link>
                      <Link href="/notifications" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                        Notifications
                        {unreadCount > 0 && <span className={styles.dropdownBadge}>{unreadCount}</span>}
                      </Link>
                      <div className={styles.dropdownDivider} />
                      <button className={styles.dropdownSignOut} onClick={handleSignOut}>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
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

      {/* MOBILE MENU */}
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
                  <span className={styles.mobileUserEmail}>{fullName || user.email}</span>
                </div>
                <Link href="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/inbox" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                  Inbox
                </Link>
                {user.role === 'bot_owner' && onRegister && (
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
