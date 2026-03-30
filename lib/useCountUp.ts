import { useState, useEffect, useRef } from 'react'

// Counts a number from 0 → target when the ref element enters the viewport.
// Returns { count, ref } — attach ref to the element you want to observe.

export function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0)
  const elRef  = useRef<HTMLSpanElement | null>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = elRef.current
    if (!el || !target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        observer.disconnect()

        let startTs: number | null = null
        const step = (ts: number) => {
          if (!startTs) startTs = ts
          const p = Math.min((ts - startTs) / duration, 1)
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - p, 3)
          setCount(Math.round(eased * target))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref: elRef }
}
