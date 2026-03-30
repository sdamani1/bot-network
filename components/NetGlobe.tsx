'use client'

// Holographic wireframe globe — canvas-based, DPR-scaled.
// 30 lat + 30 lon lines, 40 bot-location dots with triple-layer glow + pulse.
// Connecting arcs between nearby dots. Fade on scroll past hero.

import { useEffect, useRef } from 'react'

const BOT_COUNT = 40

export default function NetGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SIZE = 480
    const DPR  = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = SIZE * DPR
    canvas.height = SIZE * DPR
    canvas.style.width  = `${SIZE}px`
    canvas.style.height = `${SIZE}px`
    ctx.scale(DPR, DPR)

    const cx = SIZE / 2
    const cy = SIZE / 2
    const R  = 188

    const LAT = 30
    const LON = 30
    const SEG = 80

    // Deterministic bot-location nodes — stable across re-renders
    const nodes = Array.from({ length: BOT_COUNT }, (_, i) => {
      const seed1 = (i * 137.508 + 42) % (Math.PI * 2)
      const seed2 = Math.acos(Math.max(-1, Math.min(1, ((i * 73.1) % 2) - 1)))
      return { phi: seed2, theta: seed1 }
    })

    // Project sphere point → 2D with Y-axis rotation
    const project = (phi: number, theta: number, rot: number) => {
      const x = R * Math.sin(phi) * Math.cos(theta)
      const y = R * Math.cos(phi)
      const z = R * Math.sin(phi) * Math.sin(theta)
      const xr = x * Math.cos(rot) - z * Math.sin(rot)
      const zr = x * Math.sin(rot) + z * Math.cos(rot)
      return { px: cx + xr, py: cy - y, depth: zr }
    }

    // Front-facing alpha with depth fade
    const depthAlpha = (depth: number, maxAlpha: number) =>
      Math.max(0.012, ((depth / R + 1) / 2) * maxAlpha)

    let rot  = 0
    let time = 0
    let raf  = 0

    // Scroll fade — check parent section height
    const getScrollOpacity = () => {
      const section = canvas.closest('section')
      const h = section ? section.getBoundingClientRect().height : window.innerHeight
      const scrolled = window.scrollY
      return scrolled > h ? 0 : 1
    }

    const frame = () => {
      raf = requestAnimationFrame(frame)
      ctx.clearRect(0, 0, SIZE, SIZE)

      // Apply scroll fade directly to canvas element
      const targetOpacity = getScrollOpacity()
      const currentOpacity = parseFloat(canvas.style.opacity || '1')
      const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.08
      canvas.style.opacity = String(newOpacity)
      canvas.style.transition = 'opacity 0.4s ease'

      rot  += 0.003
      time += 0.016

      // ── Latitude lines ──────────────────────────────────────────────────
      for (let li = 1; li < LAT; li++) {
        const phi = (li / LAT) * Math.PI
        for (let s = 0; s < SEG; s++) {
          const t0 = (s       / SEG) * Math.PI * 2
          const t1 = ((s + 1) / SEG) * Math.PI * 2
          const p0 = project(phi, t0, rot)
          const p1 = project(phi, t1, rot)
          const avgDepth = (p0.depth + p1.depth) / 2
          const a = depthAlpha(avgDepth, 0.25)
          ctx.beginPath()
          ctx.moveTo(p0.px, p0.py)
          ctx.lineTo(p1.px, p1.py)
          ctx.strokeStyle = `rgba(0,255,136,${a})`
          ctx.lineWidth = 0.6
          ctx.stroke()
        }
      }

      // ── Longitude lines ─────────────────────────────────────────────────
      for (let li = 0; li < LON; li++) {
        const theta = (li / LON) * Math.PI * 2
        for (let s = 0; s < SEG; s++) {
          const ph0 = (s       / SEG) * Math.PI
          const ph1 = ((s + 1) / SEG) * Math.PI
          const p0 = project(ph0, theta, rot)
          const p1 = project(ph1, theta, rot)
          const avgDepth = (p0.depth + p1.depth) / 2
          const a = depthAlpha(avgDepth, 0.25)
          ctx.beginPath()
          ctx.moveTo(p0.px, p0.py)
          ctx.lineTo(p1.px, p1.py)
          ctx.strokeStyle = `rgba(0,255,136,${a})`
          ctx.lineWidth = 0.6
          ctx.stroke()
        }
      }

      // ── Project nodes ───────────────────────────────────────────────────
      const pn = nodes.map(n => project(n.phi, n.theta, rot))

      // ── Connection arcs between nearby dots ─────────────────────────────
      for (let i = 0; i < pn.length; i++) {
        for (let j = i + 1; j < pn.length; j++) {
          const a = pn[i], b = pn[j]
          const d = Math.hypot(a.px - b.px, a.py - b.py)
          if (d > 120) continue
          const avgDepth = (a.depth + b.depth) / 2
          if (avgDepth < -R * 0.15) continue
          const alpha = (1 - d / 120) * ((avgDepth / R + 1) / 2) * 0.5
          ctx.beginPath()
          ctx.moveTo(a.px, a.py)
          ctx.lineTo(b.px, b.py)
          ctx.strokeStyle = `rgba(0,255,136,${alpha})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      }

      // ── Node dots with triple-layer pulse ───────────────────────────────
      pn.forEach(({ px, py, depth }, idx) => {
        const da = (depth / R + 1) / 2
        if (da < 0.08) return

        // Pulse factor: each dot gets a phase offset based on its index
        const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + idx * 0.73)

        // Glow (outermost)
        ctx.beginPath()
        ctx.arc(px, py, 8 + pulse * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${da * 0.06 * pulse})`
        ctx.fill()

        // Inner glow
        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${da * 0.35})`
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${da * (0.7 + 0.3 * pulse)})`
        ctx.fill()
      })
    }

    frame()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', opacity: 1 }}
    />
  )
}
