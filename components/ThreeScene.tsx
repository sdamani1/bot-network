'use client'

// Cinematic evil humanoid robot — fixed right-half canvas.
// Silver body, red eyes, dramatic spotlights, red glowing platform.
// Animations: breathing, head scan, eye pulse, idle float, mouse tracking.
// Scroll: fades 80–100vh, display:none after 220vh.

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
    renderer.setClearColor(0x050508, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    /* ─── SCENE / CAMERA ─── */
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    )
    // z=5 fits the 1.4x-scaled 4-unit robot in the 50vw canvas
    camera.position.set(0, 0.5, 5.0)
    camera.lookAt(0, 0.5, 0)

    /* ─── LIGHTS ─── */
    scene.add(new THREE.AmbientLight(0x101018, 0.3))

    // Primary spotlight — directly above
    const spotTop = new THREE.SpotLight(0xffffff, 4.0)
    spotTop.position.set(0, 8, 2)
    spotTop.angle = 0.35
    spotTop.penumbra = 0.4
    spotTop.castShadow = true
    spotTop.shadow.mapSize.set(1024, 1024)
    spotTop.target.position.set(0, 0, 0)
    scene.add(spotTop)
    scene.add(spotTop.target)

    // Front-left fill spotlight
    const spotFront = new THREE.SpotLight(0xffffff, 2.0)
    spotFront.position.set(-4, 3, 4)
    spotFront.angle = 0.5
    spotFront.penumbra = 0.3
    spotFront.target.position.set(0, 0, 0)
    scene.add(spotFront)
    scene.add(spotFront.target)

    // Blue rim from behind
    const rimLight = new THREE.DirectionalLight(0x4444ff, 0.4)
    rimLight.position.set(0, 2, -5)
    scene.add(rimLight)

    /* ─── MATERIALS ─── */
    const primaryMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8f0,
      metalness: 0.95,
      roughness: 0.05,
    })
    const secondaryMat = new THREE.MeshStandardMaterial({
      color: 0xb0b0c0,
      metalness: 0.9,
      roughness: 0.1,
    })
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x808090,
      metalness: 0.8,
      roughness: 0.2,
    })
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: new THREE.Color(0xff0000),
      emissiveIntensity: 2.5,
    })

    /* ─── SHADOW RECEIVER ─── */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0x080810, roughness: 0.9, metalness: 0 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.45
    ground.receiveShadow = true
    scene.add(ground)

    /* ─── HELPER: create a shadow-casting mesh ─── */
    function mk(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
      const m = new THREE.Mesh(geo, mat)
      m.castShadow = true
      m.receiveShadow = true
      return m
    }

    /* ─── GROUPS ─── */
    const outerGroup = new THREE.Group()
    scene.add(outerGroup)

    const robotGroup = new THREE.Group()
    robotGroup.scale.setScalar(1.4)
    robotGroup.rotation.z = 0.03   // subtle weight shift
    outerGroup.add(robotGroup)

    // Head group — head scan + initial downward tilt
    const headGroup = new THREE.Group()
    headGroup.position.set(0, 1.65, 0)
    headGroup.rotation.x = 0.14   // watching the viewer
    robotGroup.add(headGroup)

    // Torso group — breathing scale
    const torsoGroup = new THREE.Group()
    torsoGroup.position.set(0, 0.8, 0)
    robotGroup.add(torsoGroup)

    // Arm groups — pivot at shoulder center
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.37, 1.1, 0)
    leftArmGroup.rotation.z = 0.06   // natural splay
    robotGroup.add(leftArmGroup)

    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.37, 1.1, 0)
    rightArmGroup.rotation.z = -0.06
    robotGroup.add(rightArmGroup)

    /* ─── HEAD ─── */
    headGroup.add(mk(new THREE.BoxGeometry(0.35, 0.4, 0.3), primaryMat))

    // Eye slots — narrow horizontal bars (evil)
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.038, 0.03)
    const eyeL = mk(eyeGeo, eyeMat)
    eyeL.position.set(-0.09, 0.06, 0.156)
    headGroup.add(eyeL)
    const eyeR = mk(eyeGeo, eyeMat)
    eyeR.position.set(0.09, 0.06, 0.156)
    headGroup.add(eyeR)

    // Eye glow — red PointLight, follows head
    const eyeGlowLight = new THREE.PointLight(0xff2200, 1.0, 3)
    eyeGlowLight.position.set(0, 0.06, 0.5)
    headGroup.add(eyeGlowLight)

    /* ─── NECK ─── */
    const neck = mk(new THREE.CylinderGeometry(0.06, 0.075, 0.2, 10), jointMat)
    neck.position.set(0, 1.46, 0)
    robotGroup.add(neck)

    /* ─── TORSO ─── */
    torsoGroup.add(mk(new THREE.BoxGeometry(0.6, 0.8, 0.28), primaryMat))
    // Panel accent — dark secondary plate on chest
    const panel = mk(new THREE.BoxGeometry(0.22, 0.13, 0.01), secondaryMat)
    panel.position.set(0, 0.1, 0.145)
    torsoGroup.add(panel)

    /* ─── SHOULDERS (visible spheres at arm roots) ─── */
    const shoulderL = mk(new THREE.SphereGeometry(0.12, 12, 12), jointMat)
    shoulderL.position.set(-0.37, 1.1, 0)
    robotGroup.add(shoulderL)
    const shoulderR = mk(new THREE.SphereGeometry(0.12, 12, 12), jointMat)
    shoulderR.position.set(0.37, 1.1, 0)
    robotGroup.add(shoulderR)

    /* ─── LEFT ARM (all coords relative to leftArmGroup shoulder pivot) ─── */
    // Upper arm
    const lUA = mk(new THREE.CylinderGeometry(0.08, 0.072, 0.5, 10), secondaryMat)
    lUA.position.set(0, -0.37, 0)
    leftArmGroup.add(lUA)
    // Elbow
    const lE = mk(new THREE.SphereGeometry(0.09, 10, 10), jointMat)
    lE.position.set(0, -0.62, 0)
    leftArmGroup.add(lE)
    // Forearm — slight forward cant for natural elbow bend
    const lFA = mk(new THREE.CylinderGeometry(0.065, 0.058, 0.45, 10), primaryMat)
    lFA.position.set(0, -0.89, 0.04)
    lFA.rotation.x = 0.12
    leftArmGroup.add(lFA)
    // Hand
    const lH = mk(new THREE.BoxGeometry(0.12, 0.18, 0.08), secondaryMat)
    lH.position.set(0, -1.17, 0.07)
    leftArmGroup.add(lH)

    /* ─── RIGHT ARM (mirror) ─── */
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

    // Hip joints
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

    /* ─── FEET — extended forward ─── */
    const lFt = mk(new THREE.BoxGeometry(0.18, 0.08, 0.28), primaryMat)
    lFt.position.set(-0.17, -1.0, 0.05)
    robotGroup.add(lFt)
    const rFt = mk(new THREE.BoxGeometry(0.18, 0.08, 0.28), primaryMat)
    rFt.position.set(0.17, -1.0, 0.05)
    robotGroup.add(rFt)

    /* ─── PLATFORM (world-space — not inside scaled robotGroup) ─── */
    const platformGroup = new THREE.Group()
    platformGroup.position.y = -1.45
    scene.add(platformGroup)

    const torusMat1 = new THREE.MeshStandardMaterial({
      color: 0x330000,
      emissive: new THREE.Color(0xff2200),
      emissiveIntensity: 0.9,
    })
    const t1 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 8, 72), torusMat1)
    t1.rotation.x = -Math.PI / 2
    platformGroup.add(t1)

    const torusMat2 = new THREE.MeshStandardMaterial({
      color: 0x220000,
      emissive: new THREE.Color(0xff2200),
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.4,
    })
    const t2 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.012, 8, 72), torusMat2)
    t2.rotation.x = -Math.PI / 2
    platformGroup.add(t2)

    // Red glow under robot
    const platGlow = new THREE.PointLight(0xff2200, 0.8, 4)
    platGlow.position.y = 0.15
    platformGroup.add(platGlow)

    /* ─── STAR FIELD — 600 white points, no lines ─── */
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
      opacity: 0.6,
    })))

    /* ─── INPUT TRACKING ─── */
    let tRotY = 0
    let tRotX = 0
    let scrollY = 0
    let isPaused = false

    const onMouse = (e: MouseEvent) => {
      // normalized to [-1,1] then multiplied by spec factor
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

      // Pause when tab is hidden
      if (isPaused) return

      /* ── Scroll-based canvas visibility ── */
      const vh = window.innerHeight
      if (scrollY > vh * 2.2) {
        if (container.style.display !== 'none') container.style.display = 'none'
        return
      }
      if (container.style.display === 'none') container.style.display = ''

      // Fade: fully visible 0→80vh, fade out 80→100vh
      let opacity = 1
      if (scrollY > vh * 0.8) {
        opacity = Math.max(0, 1 - (scrollY - vh * 0.8) / (vh * 0.2))
      }
      container.style.opacity = String(opacity)

      t += 0.016

      /* ── Idle float: ±0.03 units, 5s cycle ── */
      outerGroup.position.y = Math.sin(t * 1.257) * 0.03

      /* ── Breathing: torso scaleY 0.98–1.02, 3s cycle ── */
      torsoGroup.scale.y = 0.98 + Math.sin(t * 2.094) * 0.02

      /* ── Head scan: ±0.2 rad, 4s cycle ── */
      const headTarget = headScanDir * 0.2
      headGroup.rotation.y = lerp(headGroup.rotation.y, headTarget, 0.005)
      if (Math.abs(headGroup.rotation.y - headTarget) < 0.015) headScanDir *= -1

      /* ── Eye pulse: emissiveIntensity 1.8–3.0, 1.5s cycle ── */
      const eyePulse = 1.8 + (Math.sin(t * 4.189) * 0.5 + 0.5) * 1.2
      eyeMat.emissiveIntensity = eyePulse
      eyeGlowLight.intensity = 0.6 + Math.sin(t * 4.189) * 0.4

      /* ── Subtle arm sway ── */
      const sway = Math.sin(t * 0.7) * 0.05
      leftArmGroup.rotation.x  =  sway
      rightArmGroup.rotation.x = -sway

      /* ── Mouse tracking: looks at cursor ── */
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
