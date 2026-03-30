'use client'

// RobotExpressive GLTF hero — fixed 55vw canvas, stays while scrolling.
// Plays 'Idle' by default; switches to 'Walking' on scroll.
// robot.rotation.y = scrollY * 0.005 for continuous turn as user scrolls.
// Eyes pulse red. Canvas stays fixed throughout page.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
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

    let mounted = true

    /* ─── RENDERER ─── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x0a0a12, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    /* ─── SCENE / CAMERA ─── */
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0a0a12, 12, 28)

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 1.5, 4)
    camera.lookAt(0, 1, 0)

    /* ─── LIGHTS ─── */
    scene.add(new THREE.AmbientLight(0xffffff, 1.5))

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0)
    keyLight.position.set(2, 5, 3)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xaaaaff, 1.5)
    fillLight.position.set(-3, 2, 2)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0)
    rimLight.position.set(0, -2, -3)
    scene.add(rimLight)

    const spot = new THREE.SpotLight(0xffffff, 8.0)
    spot.position.set(0, 10, 3)
    spot.angle = 0.5
    spot.penumbra = 0.5
    spot.target.position.set(0, 0, 0)
    scene.add(spot)
    scene.add(spot.target)

    // Red eye glow (positioned at head height after scale)
    const headLight = new THREE.PointLight(0xff0000, 2.0, 4)
    headLight.position.set(0, 3.2, 0.3)
    scene.add(headLight)

    /* ─── PLATFORM ─── */
    const platformGroup = new THREE.Group()
    platformGroup.position.y = 0
    scene.add(platformGroup)

    const t1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.022, 8, 72),
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

    platformGroup.add(new THREE.PointLight(0xff2200, 0.6, 3))

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
      color: 0xffffff, size: 1.5, sizeAttenuation: false,
      transparent: true, opacity: 0.55,
    })))

    /* ─── GLTF MODEL ─── */
    let mixer: THREE.AnimationMixer | null = null
    const clock = new THREE.Clock()
    let currentAction: THREE.AnimationAction | null = null
    let currentAnimName = ''
    let robotScene: THREE.Group | null = null
    const animsByName: Record<string, THREE.AnimationClip> = {}
    // Collect eye materials for pulsing
    const eyeMaterials: THREE.MeshStandardMaterial[] = []

    function playAnim(name: string) {
      if (!mixer || currentAnimName === name) return
      const clip = animsByName[name]
      if (!clip) return
      const prev = currentAction
      currentAction = mixer.clipAction(clip)
      currentAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.4).play()
      if (prev) prev.fadeOut(0.4)
      currentAnimName = name
    }

    const loader = new GLTFLoader()
    loader.load(
      '/models/RobotExpressive.glb',
      (gltf) => {
        if (!mounted) return

        robotScene = gltf.scene
        robotScene.scale.setScalar(2.5)
        robotScene.position.set(0, 0, 0)
        scene.add(robotScene)

        // Traverse — collect eye materials, enable shadows
        robotScene.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return
          child.castShadow = true
          child.receiveShadow = true

          const mats = Array.isArray(child.material) ? child.material : [child.material]
          mats.forEach((mat) => {
            if (!(mat instanceof THREE.MeshStandardMaterial)) return
            const n = (mat.name + child.name).toLowerCase()
            if (n.includes('eye') || n.includes('visor')) {
              mat.emissive.set(0xff0000)
              mat.emissiveIntensity = 3.0
              eyeMaterials.push(mat)
            }
          })
        })

        // Build animation map
        gltf.animations.forEach(clip => { animsByName[clip.name] = clip })

        // Start Idle
        mixer = new THREE.AnimationMixer(robotScene)
        playAnim('Idle')
      },
      undefined,
      (err) => { console.warn('GLTFLoader error:', err) }
    )

    /* ─── INPUT TRACKING ─── */
    let scrollY = 0
    let tRotX = 0
    let tRotY = 0
    let isPaused = false

    const onMouse = (e: MouseEvent) => {
      // Subtle mouse-look on top of scroll rotation
      tRotX = ((e.clientY / window.innerHeight) * 2 - 1) * -0.08
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

    const animate = () => {
      raf = requestAnimationFrame(animate)
      if (isPaused) return

      const delta = clock.getDelta()
      t += delta

      // Update mixer (model animations)
      if (mixer) mixer.update(delta)

      // Switch Idle ↔ Walking based on scroll
      if (robotScene) {
        if (scrollY > 20 && currentAnimName !== 'Walking') {
          playAnim('Walking')
        } else if (scrollY <= 20 && currentAnimName !== 'Idle') {
          playAnim('Idle')
        }

        // Scroll-driven Y rotation — full 360 over ~1260px of scroll
        robotScene.rotation.y = scrollY * 0.005

        // Subtle mouse-look tilt
        robotScene.rotation.x = lerp(robotScene.rotation.x, tRotX, 0.05)
      }

      // Eye pulse — drives both emissiveIntensity and red headLight
      const pulse = 2.0 + (Math.sin(t * 4.0) * 0.5 + 0.5) * 2.5
      eyeMaterials.forEach(m => { m.emissiveIntensity = pulse })
      headLight.intensity = 1.0 + Math.sin(t * 4.0) * 0.8

      // Platform slow rotation
      platformGroup.rotation.y += 0.003

      renderer.render(scene, camera)
    }

    animate()

    /* ─── CLEANUP ─── */
    return () => {
      mounted = false
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
