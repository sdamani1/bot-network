import { useEffect } from 'react'

// Reveals [data-reveal] elements with a fade-up animation (defined in globals.css).
// Strategy:
//  1. Immediately reveal any element already visible in the viewport on mount.
//  2. Watch remaining elements with IntersectionObserver.
//  3. Re-run at 400ms and 1200ms to catch elements added after API responses.

function revealVisible() {
  document.querySelectorAll('[data-reveal]:not(.revealed)').forEach(el => {
    const { top, bottom } = el.getBoundingClientRect()
    if (bottom > 0 && top < window.innerHeight - 20) {
      el.classList.add('revealed')
    }
  })
}

function attachObserver(): IntersectionObserver {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.08 }   // no rootMargin — simpler and more reliable
  )

  document.querySelectorAll('[data-reveal]:not(.revealed)').forEach(el =>
    observer.observe(el)
  )

  return observer
}

export function useScrollReveal() {
  useEffect(() => {
    // Pass 1 — sync: immediately reveal anything already on screen
    revealVisible()

    // Pass 2 — set up observer for below-fold elements
    let observer = attachObserver()

    // Pass 3 — retry after API-loaded content renders (bot cards, etc.)
    const t1 = setTimeout(() => {
      revealVisible()
      observer.disconnect()
      observer = attachObserver()
    }, 400)

    const t2 = setTimeout(() => {
      revealVisible()
      observer.disconnect()
      observer = attachObserver()
    }, 1200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      observer.disconnect()
    }
  }, [])
}
