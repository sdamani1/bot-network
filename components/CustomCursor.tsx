'use client'

// Custom cursor: small green dot + trailing tail.
// Only activates on non-touch pointer:fine devices.
// Cursor scales up on hover over interactive elements.

import { useEffect, useRef, useState } from 'react'
import styles from './CustomCursor.module.css'

const TRAIL = 7

export default function CustomCursor() {
  const dotRef      = useRef<HTMLDivElement>(null)
  const ringRef     = useRef<HTMLDivElement>(null)
  const trailRefs   = useRef<(HTMLDivElement | null)[]>([])
  const pos         = useRef({ x: -200, y: -200 })
  const history     = useRef<Array<{ x: number; y: number }>>([])
  const [active, setActive] = useState(false)

  useEffect(() => {
    // Only on mouse-capable, non-touch devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
    }
    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      setActive(!!(el.closest('a,button,[role="button"],input,textarea,select')))
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)

    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const { x, y } = pos.current

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x - 4}px, ${y - 4}px)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${x - 16}px, ${y - 16}px)`
      }

      history.current.unshift({ x, y })
      if (history.current.length > TRAIL) history.current.length = TRAIL

      trailRefs.current.forEach((el, i) => {
        if (!el) return
        const p = history.current[i]
        if (!p) { el.style.opacity = '0'; return }
        const t = 1 - i / TRAIL
        el.style.transform  = `translate(${p.x - 3}px, ${p.y - 3}px)`
        el.style.opacity    = String(t * 0.35)
        el.style.width      = `${6 - i * 0.6}px`
        el.style.height     = `${6 - i * 0.6}px`
      })
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        className={`${styles.dot} ${active ? styles.dotActive : ''}`}
      />
      <div
        ref={ringRef}
        className={`${styles.ring} ${active ? styles.ringActive : ''}`}
      />
      {Array.from({ length: TRAIL }, (_, i) => (
        <div
          key={i}
          ref={el => { trailRefs.current[i] = el }}
          className={styles.trail}
        />
      ))}
    </>
  )
}
