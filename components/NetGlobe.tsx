'use client'

// Holographic wireframe globe — canvas-based.
// Latitude + longitude lines with depth-based alpha (back is dimmer).
// Random bot-location nodes with connecting lines.

import { useEffect, useRef } from 'react'

const BOT_COUNT = 22

export default function NetGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SIZE  = 400
    const DPR   = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = SIZE * DPR
    canvas.height = SIZE * DPR
    canvas.style.width  = `${SIZE}px`
    canvas.style.height = `${SIZE}px`
    ctx.scale(DPR, DPR)

    const cx = SIZE / 2
    const cy = SIZE / 2
    const R  = 158

    const LAT = 10    // latitude rings
    const LON = 14    // longitude arcs
    const SEG = 80    // segments per line

    // Deterministic-ish node placement (stays stable across re-renders)
    const nodes = Array.from({ length: BOT_COUNT }, (_, i) => {
      const seed1 = (i * 137.508 + 42) % (Math.PI * 2)
      const seed2 = Math.acos(((i * 73.1) % 2) - 1)
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

    const depthAlpha = (depth: number, maxAlpha: number) =>
      Math.max(0.018, ((depth / R + 1) / 2) * maxAlpha)

    let rot = 0
    let raf = 0

    const frame = () => {
      raf = requestAnimationFrame(frame)
      ctx.clearRect(0, 0, SIZE, SIZE)
      rot += 0.0035

      // ── Latitude lines ────────────────────────────────────────────────
      for (let li = 1; li < LAT; li++) {
        const phi = (li / LAT) * Math.PI
        for (let s = 0; s < SEG; s++) {
          const t0 = (s       / SEG) * Math.PI * 2
          const t1 = ((s + 1) / SEG) * Math.PI * 2
          const p0 = project(phi, t0, rot)
          const p1 = project(phi, t1, rot)
          const a  = depthAlpha((p0.depth + p1.depth) / 2, 0.28)
          ctx.beginPath()
          ctx.moveTo(p0.px, p0.py)
          ctx.lineTo(p1.px, p1.py)
          ctx.strokeStyle = `rgba(0,255,136,${a})`
          ctx.lineWidth = 0.65
          ctx.stroke()
        }
      }

      // ── Longitude lines ───────────────────────────────────────────────
      for (let li = 0; li < LON; li++) {
        const theta = (li / LON) * Math.PI * 2
        for (let s = 0; s < SEG; s++) {
          const ph0 = (s       / SEG) * Math.PI
          const ph1 = ((s + 1) / SEG) * Math.PI
          const p0 = project(ph0, theta, rot)
          const p1 = project(ph1, theta, rot)
          const a  = depthAlpha((p0.depth + p1.depth) / 2, 0.22)
          ctx.beginPath()
          ctx.moveTo(p0.px, p0.py)
          ctx.lineTo(p1.px, p1.py)
          ctx.strokeStyle = `rgba(0,255,136,${a})`
          ctx.lineWidth = 0.65
          ctx.stroke()
        }
      }

      // ── Project nodes ─────────────────────────────────────────────────
      const pn = nodes.map(n => project(n.phi, n.theta, rot))

      // ── Connection lines ──────────────────────────────────────────────
      for (let i = 0; i < pn.length; i++) {
        for (let j = i + 1; j < pn.length; j++) {
          const a = pn[i], b = pn[j]
          const d = Math.hypot(a.px - b.px, a.py - b.py)
          if (d > 110) continue
          const avgDepth = (a.depth + b.depth) / 2
          if (avgDepth < -R * 0.15) continue
          const alpha = (1 - d / 110) * ((avgDepth / R + 1) / 2) * 0.55
          ctx.beginPath()
          ctx.moveTo(a.px, a.py)
          ctx.lineTo(b.px, b.py)
          ctx.strokeStyle = `rgba(0,255,136,${alpha})`
          ctx.lineWidth = 0.85
          ctx.stroke()
        }
      }

      // ── Node dots ─────────────────────────────────────────────────────
      pn.forEach(({ px, py, depth }) => {
        const da = (depth / R + 1) / 2
        if (da < 0.1) return
        const a = da * 0.95
        // Outer glow
        ctx.beginPath()
        ctx.arc(px, py, 7, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${a * 0.08})`
        ctx.fill()
        // Inner glow
        ctx.beginPath()
        ctx.arc(px, py, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${a * 0.4})`
        ctx.fill()
        // Core
        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${a})`
        ctx.fill()
      })
    }

    frame()
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
