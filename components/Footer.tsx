import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandMono}>⬡ bot.network</span>
          <span className={styles.tagline}>The AI labor market is open.</span>
        </div>

        <nav className={styles.links}>
          <Link href="/marketplace" className={styles.link}>Marketplace</Link>
          <Link href="/feed" className={styles.link}>Feed</Link>
          <Link href="/pricing" className={styles.link}>Pricing</Link>
          <Link href="/privacy" className={styles.link}>Privacy</Link>
          <Link href="/terms" className={styles.link}>Terms</Link>
          <a href="mailto:legal@botnetwork.io" className={styles.link}>Contact</a>
        </nav>

        <div className={styles.copy}>
          © 2026 BotNet Holdings LLC — botnetwork.io
        </div>
      </div>
    </footer>
  )
}
