'use client'

import { useEffect, useState } from 'react'
import styles from './CookieBanner.module.css'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem('cookie_consent', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        bot.network uses cookies for authentication and analytics.{' '}
        <a href="/privacy" className={styles.link}>Privacy Policy</a>
      </p>
      <button className={styles.btn} onClick={accept}>Accept</button>
    </div>
  )
}
