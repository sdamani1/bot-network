'use client'

// Full-page particle network — fixed behind all content.
// 2D canvas: ~1000 floating particles + proximity connection lines.
// Particles flee from cursor. Reduce to 500 on mobile.

import { useEffect, useRef } from 'react'
import styles from './ParticleNet.module.css'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  base: number  // base opacity
}

export default function ParticleNet() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isMobile = window.innerWidth < 768
    const COUNT         = isMobile ? 500  : 1000
    const CONNECT_N     = isMobile ? 150  : 350   // subset used for line drawing
    const MAX_DIST_SQ   = isMobile ? 100 * 100 : 120 * 120
    const MOUSE_DIST_SQ = 90 * 90
    const MAX_SPEED     = 0.7

    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width  = W
    canvas.height = H

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      vx:   (Math.random() - 0.5) * 0.22,
      vy:   (Math.random() - 0.5) * 0.22,
      base: 0.18 + Math.random() * 0.32,
    }))

    let mx = -9999
    let my = -9999
    const onMouseMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', onMouseMove)

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W
      canvas.height = H
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, W, H)

      for (let i = 0; i < COUNT; i++) {
        const p = particles[i]

        // Mouse repulsion
        const mdx = p.x - mx
        const mdy = p.y - my
        const mdSq = mdx * mdx + mdy * mdy
        if (mdSq < MOUSE_DIST_SQ && mdSq > 1) {
          const inv = 0.35 / Math.sqrt(mdSq)
          p.vx += mdx * inv
          p.vy += mdy * inv
        }

        // Speed cap + damping
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (spd > MAX_SPEED) { p.vx = (p.vx / spd) * MAX_SPEED; p.vy = (p.vy / spd) * MAX_SPEED }
        p.vx *= 0.992
        p.vy *= 0.992

        p.x += p.vx
        p.y += p.vy

        // Wrap
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        // Draw dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${p.base * 0.45})`
        ctx.fill()
      }

      // Connection lines (first CONNECT_N particles only)
      for (let i = 0; i < CONNECT_N; i++) {
        const pi = particles[i]
        for (let j = i + 1; j < CONNECT_N; j++) {
          const pj = particles[j]
          const dx = pi.x - pj.x
          const dy = pi.y - pj.y
          const dSq = dx * dx + dy * dy
          if (dSq < MAX_DIST_SQ) {
            const alpha = (1 - dSq / MAX_DIST_SQ) * 0.10
            ctx.beginPath()
            ctx.moveTo(pi.x, pi.y)
            ctx.lineTo(pj.x, pj.y)
            ctx.strokeStyle = `rgba(0,255,136,${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} />
}
