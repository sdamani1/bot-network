'use client'

// Spline 3D robot scene — right column of hero section.
// Dynamic import prevents SSR issues with the Spline canvas.

import dynamic from 'next/dynamic'
import styles from './HeroScene.module.css'

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
})

export default function HeroScene() {
  return (
    <div className={styles.container}>
      <Spline
        scene="https://prod.spline.design/jZYCiIBWBFHMXbGB/scene.splinecode"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
