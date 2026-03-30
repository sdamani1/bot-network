'use client'

// Cinematic evil humanoid robot — fixed right-half canvas (55vw).
// Bright silver body, glowing red eyes, strong multi-light setup.
// Canvas hides when hero section scrolls out of viewport.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import styles from './ThreeScene.module.css'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return
    if (!container.clientWidth || !container.clientHeight) return

    /* ─── RENDERER ─── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x0a0a12, 1)
    container.appendChild(renderer.domElement)

    /* ─── SCENE / CAMERA ─── */
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    )
    camera.position.set(0, 1.5, 5)
    camera.lookAt(0, 0, 0)

    /* ─── LIGHTS ─── */
    // Bright ambient so robot is never dark
    scene.add(new THREE.AmbientLight(0xffffff, 1.5))

    // Key — top-right
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0)
    keyLight.position.set(2, 5, 3)
    scene.add(keyLight)

    // Fill — cool blue-white from left
    const fillLight = new THREE.DirectionalLight(0xaaaaff, 1.5)
    fillLight.position.set(-3, 2, 2)
    scene.add(fillLight)

    // Rim — from behind/below
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0)
    rimLight.position.set(0, -2, -3)
    scene.add(rimLight)

    // Dramatic overhead spotlight
    const spot = new THREE.SpotLight(0xffffff, 8.0)
    spot.position.set(0, 10, 3)
    spot.angle = 0.5
    spot.penumbra = 0.5
    spot.target.position.set(0, 0, 0)
    scene.add(spot)
    scene.add(spot.target)

    /* ─── MATERIALS ─── */
    const primaryMat = new THREE.MeshStandardMaterial({
      color: 0xd0d0e0,
      metalness: 0.7,
      roughness: 0.2,
    })
    const secondaryMat = new THREE.MeshStandardMaterial({
      color: 0xa0a0b0,
      metalness: 0.6,
      roughness: 0.3,
    })
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x808090,
      metalness: 0.7,
      roughness: 0.25,
    })
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: new THREE.Color(0xff0000),
      emissiveIntensity: 3.0,
    })

    /* ─── HELPER ─── */
    function mk(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
      return new THREE.Mesh(geo, mat)
    }

    /* ─── GROUPS ─── */
    const outerGroup = new THREE.Group()
    scene.add(outerGroup)

    const robotGroup = new THREE.Group()
    robotGroup.scale.setScalar(1.8)
    robotGroup.rotation.z = 0.03   // subtle weight shift
    outerGroup.add(robotGroup)

    // Head group — head scan rotation + initial downward tilt
    const headGroup = new THREE.Group()
    headGroup.position.set(0, 1.65, 0)
    headGroup.rotation.x = 0.14
    robotGroup.add(headGroup)

    // Torso group — breathing scale
    const torsoGroup = new THREE.Group()
    torsoGroup.position.set(0, 0.8, 0)
    robotGroup.add(torsoGroup)

    // Arm groups — pivot at shoulder center
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.37, 1.1, 0)
    leftArmGroup.rotation.z = 0.06
    robotGroup.add(leftArmGroup)

    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.37, 1.1, 0)
    rightArmGroup.rotation.z = -0.06
    robotGroup.add(rightArmGroup)

    /* ─── HEAD ─── */
    headGroup.add(mk(new THREE.BoxGeometry(0.35, 0.4, 0.3), primaryMat))

    // Eye slots — narrow horizontal bars
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.038, 0.03)
    const eyeL = mk(eyeGeo, eyeMat)
    eyeL.position.set(-0.09, 0.06, 0.156)
    headGroup.add(eyeL)
    const eyeR = mk(eyeGeo, eyeMat)
    eyeR.position.set(0.09, 0.06, 0.156)
    headGroup.add(eyeR)

    // Red PointLight at head — illuminates surroundings with evil glow
    const eyeGlowLight = new THREE.PointLight(0xff0000, 2.0, 4)
    eyeGlowLight.position.set(0, 0.06, 0.4)
    headGroup.add(eyeGlowLight)

    /* ─── NECK ─── */
    const neck = mk(new THREE.CylinderGeometry(0.06, 0.075, 0.2, 10), jointMat)
    neck.position.set(0, 1.46, 0)
    robotGroup.add(neck)

    /* ─── TORSO ─── */
    torsoGroup.add(mk(new THREE.BoxGeometry(0.6, 0.8, 0.28), primaryMat))
    const panel = mk(new THREE.BoxGeometry(0.22, 0.13, 0.01), secondaryMat)
    panel.position.set(0, 0.1, 0.145)
    torsoGroup.add(panel)

    /* ─── SHOULDERS ─── */
    const shoulderL = mk(new THREE.SphereGeometry(0.12, 12, 12), jointMat)
    shoulderL.position.set(-0.37, 1.1, 0)
    robotGroup.add(shoulderL)
    const shoulderR = mk(new THREE.SphereGeometry(0.12, 12, 12), jointMat)
    shoulderR.position.set(0.37, 1.1, 0)
    robotGroup.add(shoulderR)

    /* ─── LEFT ARM ─── */
    const lUA = mk(new THREE.CylinderGeometry(0.08, 0.072, 0.5, 10), secondaryMat)
    lUA.position.set(0, -0.37, 0)
    leftArmGroup.add(lUA)
    const lE = mk(new THREE.SphereGeometry(0.09, 10, 10), jointMat)
    lE.position.set(0, -0.62, 0)
    leftArmGroup.add(lE)
    const lFA = mk(new THREE.CylinderGeometry(0.065, 0.058, 0.45, 10), primaryMat)
    lFA.position.set(0, -0.89, 0.04)
    lFA.rotation.x = 0.12
    leftArmGroup.add(lFA)
    const lH = mk(new THREE.BoxGeometry(0.12, 0.18, 0.08), secondaryMat)
    lH.position.set(0, -1.17, 0.07)
    leftArmGroup.add(lH)

    /* ─── RIGHT ARM ─── */
    const rUA = mk(new THREE.CylinderGeometry(0.08, 0.072, 0.5, 10), secondaryMat)
    rUA.position.set(0, -0.37, 0)
    rightArmGroup.add(rUA)
    const rE = mk(new THREE.SphereGeometry(0.09, 10, 10), jointMat)
    rE.position.set(0, -0.62, 0)
    rightArmGroup.add(rE)
    const rFA = mk(new THREE.CylinderGeometry(0.065, 0.058, 0.45, 10), primaryMat)
    rFA.position.set(0, -0.89, 0.04)
    rFA.rotation.x = 0.12
    rightArmGroup.add(rFA)
    const rH = mk(new THREE.BoxGeometry(0.12, 0.18, 0.08), secondaryMat)
    rH.position.set(0, -1.17, 0.07)
    rightArmGroup.add(rH)

    /* ─── HIPS ─── */
    const hips = mk(new THREE.BoxGeometry(0.5, 0.15, 0.25), primaryMat)
    hips.position.set(0, 0.25, 0)
    robotGroup.add(hips)
    const lHJ = mk(new THREE.SphereGeometry(0.1, 10, 10), jointMat)
    lHJ.position.set(-0.17, 0.14, 0)
    robotGroup.add(lHJ)
    const rHJ = mk(new THREE.SphereGeometry(0.1, 10, 10), jointMat)
    rHJ.position.set(0.17, 0.14, 0)
    robotGroup.add(rHJ)

    /* ─── UPPER LEGS ─── */
    const lUL = mk(new THREE.CylinderGeometry(0.1, 0.09, 0.6, 10), secondaryMat)
    lUL.position.set(-0.17, -0.08, 0)
    robotGroup.add(lUL)
    const rUL = mk(new THREE.CylinderGeometry(0.1, 0.09, 0.6, 10), secondaryMat)
    rUL.position.set(0.17, -0.08, 0)
    robotGroup.add(rUL)

    /* ─── KNEES ─── */
    const lK = mk(new THREE.SphereGeometry(0.11, 10, 10), jointMat)
    lK.position.set(-0.17, -0.41, 0)
    robotGroup.add(lK)
    const rK = mk(new THREE.SphereGeometry(0.11, 10, 10), jointMat)
    rK.position.set(0.17, -0.41, 0)
    robotGroup.add(rK)

    /* ─── LOWER LEGS ─── */
    const lLL = mk(new THREE.CylinderGeometry(0.085, 0.075, 0.55, 10), primaryMat)
    lLL.position.set(-0.17, -0.71, 0)
    robotGroup.add(lLL)
    const rLL = mk(new THREE.CylinderGeometry(0.085, 0.075, 0.55, 10), primaryMat)
    rLL.position.set(0.17, -0.71, 0)
    robotGroup.add(rLL)

    /* ─── FEET ─── */
    const lFt = mk(new THREE.BoxGeometry(0.18, 0.08, 0.28), primaryMat)
    lFt.position.set(-0.17, -1.0, 0.05)
    robotGroup.add(lFt)
    const rFt = mk(new THREE.BoxGeometry(0.18, 0.08, 0.28), primaryMat)
    rFt.position.set(0.17, -1.0, 0.05)
    robotGroup.add(rFt)

    /* ─── PLATFORM ─── */
    const platformGroup = new THREE.Group()
    platformGroup.position.y = -1.85   // world Y: robot feet at -1.0 * 1.8 = -1.8
    scene.add(platformGroup)

    const t1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.025, 8, 72),
      new THREE.MeshStandardMaterial({
        color: 0x330000,
        emissive: new THREE.Color(0xff2200),
        emissiveIntensity: 1.0,
      })
    )
    t1.rotation.x = -Math.PI / 2
    platformGroup.add(t1)

    const t2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.012, 8, 72),
      new THREE.MeshStandardMaterial({
        color: 0x220000,
        emissive: new THREE.Color(0xff2200),
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.5,
      })
    )
    t2.rotation.x = -Math.PI / 2
    platformGroup.add(t2)

    const platGlow = new THREE.PointLight(0xff2200, 0.6, 3)
    platGlow.position.y = 0.1
    platformGroup.add(platGlow)

    /* ─── STAR FIELD ─── */
    const STAR_N = 600
    const starPos = new Float32Array(STAR_N * 3)
    for (let i = 0; i < STAR_N; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 80
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 40
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 20
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.55,
    })))

    /* ─── INPUT TRACKING ─── */
    let tRotY = 0
    let tRotX = 0
    let scrollY = 0
    let isPaused = false

    const onMouse = (e: MouseEvent) => {
      tRotY = ((e.clientX / window.innerWidth) * 2 - 1) * 0.3
      tRotX = ((e.clientY / window.innerHeight) * 2 - 1) * -0.1
    }
    const onScroll = () => { scrollY = window.scrollY }
    const onVisibility = () => { isPaused = document.hidden }
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    /* ─── ANIMATION LOOP ─── */
    let raf = 0
    let t = 0
    let headScanDir = 1

    const animate = () => {
      raf = requestAnimationFrame(animate)

      if (isPaused) return

      /* ── Hide canvas when hero section is out of viewport ── */
      const heroHeight = window.innerHeight
      if (scrollY >= heroHeight) {
        if (container.style.display !== 'none') container.style.display = 'none'
        return
      }
      if (container.style.display === 'none') container.style.display = ''
      container.style.opacity = '1'

      t += 0.016

      /* ── Idle float ── */
      outerGroup.position.y = Math.sin(t * 1.257) * 0.03

      /* ── Breathing: torso scaleY 0.98–1.02, 3s cycle ── */
      torsoGroup.scale.y = 0.98 + Math.sin(t * 2.094) * 0.02

      /* ── Head scan: ±0.2 rad ── */
      const headTarget = headScanDir * 0.2
      headGroup.rotation.y = lerp(headGroup.rotation.y, headTarget, 0.005)
      if (Math.abs(headGroup.rotation.y - headTarget) < 0.015) headScanDir *= -1

      /* ── Eye pulse: emissiveIntensity 2.0–4.0 ── */
      const eyePulse = 2.0 + (Math.sin(t * 4.189) * 0.5 + 0.5) * 2.0
      eyeMat.emissiveIntensity = eyePulse
      eyeGlowLight.intensity = 1.2 + Math.sin(t * 4.189) * 0.8

      /* ── Arm sway ── */
      const sway = Math.sin(t * 0.7) * 0.05
      leftArmGroup.rotation.x  =  sway
      rightArmGroup.rotation.x = -sway

      /* ── Mouse tracking ── */
      robotGroup.rotation.y = lerp(robotGroup.rotation.y, tRotY, 0.05)
      robotGroup.rotation.x = lerp(robotGroup.rotation.x, tRotX, 0.05)

      /* ── Platform slow rotation ── */
      platformGroup.rotation.y += 0.003

      renderer.render(scene, camera)
    }

    animate()

    /* ─── CLEANUP ─── */
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
      starGeo.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className={styles.canvas} />
}
