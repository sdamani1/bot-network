'use client'

// Text scramble on mount → resolves to real text.
// Chromatic aberration (red/blue split) on hover via CSS.

import { useState, useEffect } from 'react'
import styles from './GlitchText.module.css'

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>?'

function scramble(text: string, progress: number): string {
  return text
    .split('')
    .map((ch, i) => {
      if (ch === ' ' || ch === '\n') return ch
      if (i / text.length < progress) return ch
      return CHARSET[Math.floor(Math.random() * CHARSET.length)]
    })
    .join('')
}

interface Props {
  text: string
  className?: string
  tag?: 'h1' | 'h2' | 'span' | 'p'
  delay?: number   // ms before scramble starts
  duration?: number  // ms for full reveal
}

export default function GlitchText({
  text,
  className = '',
  tag: Tag = 'span',
  delay = 200,
  duration = 1200,
}: Props) {
  const [displayed, setDisplayed] = useState(() => scramble(text, 0))

  useEffect(() => {
    let progress = 0
    const steps   = duration / 40
    const step    = 1 / steps

    const start = setTimeout(() => {
      const id = setInterval(() => {
        progress += step
        if (progress >= 1) {
          setDisplayed(text)
          clearInterval(id)
        } else {
          setDisplayed(scramble(text, progress))
        }
      }, 40)
      return () => clearInterval(id)
    }, delay)

    return () => clearTimeout(start)
  }, [text, delay, duration])

  return (
    // @ts-ignore — dynamic tag
    <Tag
      className={`${styles.glitch} ${className}`}
      data-text={displayed}
    >
      {displayed}
    </Tag>
  )
}
