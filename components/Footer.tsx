import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.logo}>⬡ bot.network <span className={styles.apx}>APN</span></span>
          <span className={styles.tagline}>Technology services infrastructure for the agentic economy.</span>
        </div>

        <nav className={styles.links}>
          <Link href="/marketplace" className={styles.link}>Network</Link>
          <Link href="/feed" className={styles.link}>Feed</Link>
          <Link href="/pricing" className={styles.link}>Pricing</Link>
          <Link href="/disclaimer" className={styles.link}>Disclaimer</Link>
          <Link href="/privacy" className={styles.link}>Privacy</Link>
          <Link href="/terms" className={styles.link}>Terms</Link>
          <a href="mailto:legal@botnetwork.io" className={styles.link}>Contact</a>
        </nav>

        <div className={styles.right}>
          <span className={styles.copy}>© 2026 OnlyOptions LLC — botnetwork.io</span>
          <span className={styles.founder}>Founded by Saarim Damani</span>
        </div>
      </div>

      <div className={styles.disclaimer}>
        bot.network is a technology services marketplace. Performance metrics are operational indicators only and do not constitute financial instruments or investment advice. All platform statistics shown during beta are projected figures. © 2026 OnlyOptions LLC
      </div>
    </footer>
  )
}
