'use client'

// Three.js 3D robot hero — dynamic import only (ssr: false)
// Robot: icosahedron torso + octahedron head + glowing edges + orbital particles + stars
// Reacts to mouse (tilt) and scroll (parallax right + scale)

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

    /* ─── RENDERER ─── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    /* ─── SCENE / CAMERA ─── */
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    )
    camera.position.set(0, 0.4, 7.2)

    /* ─── LIGHTS ─── */
    scene.add(new THREE.AmbientLight(0x08081e, 4))
    const keyLight = new THREE.PointLight(0x00ff88, 5, 35)
    keyLight.position.set(5, 6, 6)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(0x4488ff, 3, 28)
    rimLight.position.set(-5, -2, 4)
    scene.add(rimLight)
    const backLight = new THREE.PointLight(0x9b59ff, 2, 22)
    backLight.position.set(0, -5, -6)
    scene.add(backLight)

    /* ─── MATERIALS ─── */
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x06061a,
      shininess: 160,
      specular: new THREE.Color(0x2255cc),
      transparent: true,
      opacity: 0.96,
    })
    const edgeBright = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.8,
    })
    const edgeDim = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.28,
    })
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.85,
    })

    /* ─── CONTAINERS ─── */
    // outerGroup handles scroll position + scale
    const outerGroup = new THREE.Group()
    scene.add(outerGroup)

    // robot handles Y-axis spin + mouse tilt
    const robot = new THREE.Group()
    outerGroup.add(robot)

    /* ─── BUILDER HELPERS ─── */
    function addPart(
      geo: THREE.BufferGeometry,
      x = 0, y = 0, z = 0,
      edgeMat = edgeBright
    ) {
      const mesh = new THREE.Mesh(geo, bodyMat)
      mesh.position.set(x, y, z)
      robot.add(mesh)

      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat)
      edges.position.set(x, y, z)
      robot.add(edges)
    }

    /* ─── ROBOT BODY ─── */
    // Torso — icosahedron (20 triangular faces → distinctive edge pattern)
    addPart(new THREE.IcosahedronGeometry(1.08, 0), 0, 0, 0, edgeBright)

    // Head — octahedron
    addPart(new THREE.OctahedronGeometry(0.46, 0), 0, 1.83, 0, edgeBright)

    // Neck
    addPart(new THREE.CylinderGeometry(0.1, 0.14, 0.32, 6), 0, 1.35, 0, edgeDim)

    // Shoulders
    addPart(new THREE.OctahedronGeometry(0.31, 0), -1.5, 0.38, 0, edgeDim)
    addPart(new THREE.OctahedronGeometry(0.31, 0),  1.5, 0.38, 0, edgeDim)

    // Forearms
    addPart(new THREE.BoxGeometry(0.11, 0.72, 0.11), -1.5, -0.34, 0, edgeDim)
    addPart(new THREE.BoxGeometry(0.11, 0.72, 0.11),  1.5, -0.34, 0, edgeDim)

    // Hands
    addPart(new THREE.OctahedronGeometry(0.17, 0), -1.5, -0.8, 0, edgeDim)
    addPart(new THREE.OctahedronGeometry(0.17, 0),  1.5, -0.8, 0, edgeDim)

    // Hips
    addPart(new THREE.BoxGeometry(0.58, 0.18, 0.28), 0, -1.15, 0, edgeDim)

    // Thighs
    addPart(new THREE.CylinderGeometry(0.14, 0.11, 0.65, 6), -0.36, -1.6, 0, edgeDim)
    addPart(new THREE.CylinderGeometry(0.14, 0.11, 0.65, 6),  0.36, -1.6, 0, edgeDim)

    // Feet
    addPart(new THREE.BoxGeometry(0.18, 0.1, 0.28), -0.36, -2.02, 0, edgeDim)
    addPart(new THREE.BoxGeometry(0.18, 0.1, 0.28),  0.36, -2.02, 0, edgeDim)

    /* ─── ENERGY CORE ─── */
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), coreMat)
    robot.add(core)
    const coreLight = new THREE.PointLight(0x00ff88, 2.5, 6)
    robot.add(coreLight)

    /* ─── EYES ─── */
    const eyeGeo = new THREE.SphereGeometry(0.072, 8, 8)
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.19, 1.92, 0.41)
    eyeR.position.set( 0.19, 1.92, 0.41)
    robot.add(eyeL, eyeR)

    const eyeLightL = new THREE.PointLight(0x00ff88, 1.8, 2.2)
    eyeLightL.position.copy(eyeL.position)
    const eyeLightR = new THREE.PointLight(0x00ff88, 1.8, 2.2)
    eyeLightR.position.copy(eyeR.position)
    robot.add(eyeLightL, eyeLightR)

    /* ─── ORBIT PARTICLES ─── */
    const ORBIT_N = 500
    const oPos    = new Float32Array(ORBIT_N * 3)
    const oAngle  = new Float32Array(ORBIT_N)
    const oRadius = new Float32Array(ORBIT_N)
    const oSpeed  = new Float32Array(ORBIT_N)
    const oTilt   = new Float32Array(ORBIT_N)

    for (let i = 0; i < ORBIT_N; i++) {
      oAngle[i]  = Math.random() * Math.PI * 2
      oRadius[i] = 2.3 + Math.random() * 2.4
      oSpeed[i]  = (0.003 + Math.random() * 0.007) * (Math.random() < 0.5 ? 1 : -1)
      oTilt[i]   = Math.random() * Math.PI
    }

    const orbitGeo = new THREE.BufferGeometry()
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(oPos, 3))
    const orbitPoints = new THREE.Points(
      orbitGeo,
      new THREE.PointsMaterial({
        color: 0x00ff88,
        size: 0.03,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true,
      })
    )
    outerGroup.add(orbitPoints)  // moves with robot on scroll

    /* ─── STAR FIELD ─── */
    const STAR_N = 1000
    const starPos = new Float32Array(STAR_N * 3)
    for (let i = 0; i < STAR_N; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 280
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 280
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 120 - 60
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.14,
          transparent: true,
          opacity: 0.38,
          sizeAttenuation: true,
        })
      )
    )

    /* ─── INPUT TRACKING ─── */
    let tRotX = 0
    let tRotY = 0
    let scrollY = 0

    const onMouse = (e: MouseEvent) => {
      tRotX = ((e.clientY / window.innerHeight) - 0.5) * 0.42
      tRotY = ((e.clientX / window.innerWidth)  - 0.5) * 0.55
    }
    const onScroll = () => { scrollY = window.scrollY }
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    /* ─── ANIMATION LOOP ─── */
    let raf = 0
    let t = 0

    const animate = () => {
      raf = requestAnimationFrame(animate)
      t += 0.016

      // Continuous Y-axis spin + mouse tilt
      robot.rotation.y += 0.004
      robot.rotation.x = lerp(robot.rotation.x, tRotX, 0.05)

      // Scroll parallax: slide right, shrink
      const sf = Math.min(scrollY / 520, 1)
      outerGroup.position.x = lerp(outerGroup.position.x, sf * 4.0, 0.06)
      outerGroup.position.y = lerp(outerGroup.position.y, -sf * 0.6, 0.06)
      outerGroup.scale.setScalar(lerp(outerGroup.scale.x, 1 - sf * 0.28, 0.06))

      // Eye + core pulse
      const pulse = 0.7 + Math.sin(t * 2.8) * 0.38
      eyeLightL.intensity = pulse * 1.8
      eyeLightR.intensity = pulse * 1.8
      coreLight.intensity = pulse * 2.8
      coreMat.opacity = 0.6 + pulse * 0.3

      // Orbit particles
      const buf = orbitGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < ORBIT_N; i++) {
        oAngle[i] += oSpeed[i]
        const r = oRadius[i]
        const a = oAngle[i]
        const tilt = oTilt[i]
        buf.setXYZ(
          i,
          r * Math.cos(a),
          r * Math.sin(a) * Math.sin(tilt),
          r * Math.sin(a) * Math.cos(tilt)
        )
      }
      buf.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    /* ─── CLEANUP ─── */
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={mountRef} className={styles.canvas} />
}
