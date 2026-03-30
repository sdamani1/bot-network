'use client'

// Three.js humanoid robot hero — dynamic import only (ssr: false)
// Proper anatomical humanoid: box head, cylinder limbs, sphere joints
// Idle breathing + head scan + arm sway + mouse parallax + scroll walk

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
    renderer.shadowMap.enabled = false
    container.appendChild(renderer.domElement)

    /* ─── SCENE / CAMERA ─── */
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0d0d0f, 16, 30)

    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    )
    // Camera slightly elevated looking at robot center-right
    camera.position.set(0, 1.0, 9)
    camera.lookAt(1.8, 0.3, 0)

    /* ─── LIGHTING ─── */
    // Ambient — dark blue-grey
    scene.add(new THREE.AmbientLight(0x404060, 0.4))

    // Key — top-right directional
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(5, 8, 4)
    scene.add(keyLight)

    // Fill — green point from front
    const greenLight = new THREE.PointLight(0x00ff88, 0.5, 10)
    greenLight.position.set(2, 2, 6)
    scene.add(greenLight)

    // Rim — blue from behind
    const rimLight = new THREE.PointLight(0x4444ff, 0.3, 14)
    rimLight.position.set(0, 3, -7)
    scene.add(rimLight)

    /* ─── MATERIALS ─── */
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x8a8a9a,
      metalness: 0.8,
      roughness: 0.2,
    })

    const emissiveMat = new THREE.MeshStandardMaterial({
      color: 0x003318,
      emissive: new THREE.Color(0x00ff88),
      emissiveIntensity: 0.8,
      metalness: 0.4,
      roughness: 0.4,
    })

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x6a6a7e,
      metalness: 0.9,
      roughness: 0.15,
      emissive: new THREE.Color(0x00ff88),
      emissiveIntensity: 0.12,
    })

    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x002211,
      emissive: new THREE.Color(0x00ff88),
      emissiveIntensity: 0.7,
    })

    /* ─── GROUP HIERARCHY ─── */
    // outerGroup: scroll parallax
    const outerGroup = new THREE.Group()
    outerGroup.position.set(1.8, -0.2, 0)
    scene.add(outerGroup)

    // robotGroup: mouse tilt
    const robotGroup = new THREE.Group()
    outerGroup.add(robotGroup)

    // headGroup: head scan animation (pivot at head center)
    const headGroup = new THREE.Group()
    headGroup.position.set(0, 1.85, 0)
    robotGroup.add(headGroup)

    // torsoGroup: breathing scale
    const torsoGroup = new THREE.Group()
    torsoGroup.position.set(0, 0.7, 0)
    robotGroup.add(torsoGroup)

    // arm groups: pivot at shoulder
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.55, 1.1, 0)
    robotGroup.add(leftArmGroup)

    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.55, 1.1, 0)
    robotGroup.add(rightArmGroup)

    /* ─── HEAD ─── */
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.54, 0.44), bodyMat)
    headGroup.add(headMesh)

    // Eye slots — emissive green horizontal bars
    const eyeGeo = new THREE.BoxGeometry(0.13, 0.055, 0.04)
    const eyeL = new THREE.Mesh(eyeGeo, emissiveMat)
    eyeL.position.set(-0.13, 0.05, 0.225)
    headGroup.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, emissiveMat)
    eyeR.position.set( 0.13, 0.05, 0.225)
    headGroup.add(eyeR)

    // Eye point lights (follow head rotation)
    const eyeLightL = new THREE.PointLight(0x00ff88, 0.7, 1.8)
    eyeLightL.position.set(-0.13, 0.05, 0.5)
    headGroup.add(eyeLightL)
    const eyeLightR = new THREE.PointLight(0x00ff88, 0.7, 1.8)
    eyeLightR.position.set( 0.13, 0.05, 0.5)
    headGroup.add(eyeLightR)

    /* ─── NECK ─── */
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.24, 10), bodyMat)
    neck.position.set(0, 1.54, 0)
    robotGroup.add(neck)

    /* ─── TORSO ─── */
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.08, 0.44), bodyMat)
    torsoGroup.add(torsoMesh)

    // Chest panel — emissive
    const chestPanel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.17, 0.02), emissiveMat)
    chestPanel.position.set(0, 0.1, 0.235)
    torsoGroup.add(chestPanel)

    const chestLight = new THREE.PointLight(0x00ff88, 0.45, 2.2)
    chestLight.position.set(0, 0.8, 0.6)
    robotGroup.add(chestLight)

    /* ─── LEFT ARM (all relative to leftArmGroup pivot at shoulder) ─── */
    // Shoulder sphere
    leftArmGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), jointMat))
    // Upper arm
    const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.082, 0.5, 10), bodyMat)
    leftUpperArm.position.set(0, -0.36, 0)
    leftArmGroup.add(leftUpperArm)
    // Elbow
    const leftElbow = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10), jointMat)
    leftElbow.position.set(0, -0.64, 0)
    leftArmGroup.add(leftElbow)
    // Lower arm
    const leftLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.068, 0.46, 10), bodyMat)
    leftLowerArm.position.set(0, -0.9, 0)
    leftArmGroup.add(leftLowerArm)
    // Hand
    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.088), bodyMat)
    leftHand.position.set(0, -1.17, 0)
    leftArmGroup.add(leftHand)

    /* ─── RIGHT ARM ─── */
    rightArmGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), jointMat))
    const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.082, 0.5, 10), bodyMat)
    rightUpperArm.position.set(0, -0.36, 0)
    rightArmGroup.add(rightUpperArm)
    const rightElbow = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10), jointMat)
    rightElbow.position.set(0, -0.64, 0)
    rightArmGroup.add(rightElbow)
    const rightLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.068, 0.46, 10), bodyMat)
    rightLowerArm.position.set(0, -0.9, 0)
    rightArmGroup.add(rightLowerArm)
    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.088), bodyMat)
    rightHand.position.set(0, -1.17, 0)
    rightArmGroup.add(rightHand)

    /* ─── HIPS ─── */
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.27, 0.41), bodyMat)
    hips.position.set(0, 0.12, 0)
    robotGroup.add(hips)

    // Hip joints
    const leftHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), jointMat)
    leftHipJoint.position.set(-0.27, -0.05, 0)
    robotGroup.add(leftHipJoint)
    const rightHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), jointMat)
    rightHipJoint.position.set( 0.27, -0.05, 0)
    robotGroup.add(rightHipJoint)

    /* ─── LEGS ─── */
    // Upper legs
    const leftUpperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.126, 0.108, 0.57, 10), bodyMat)
    leftUpperLeg.position.set(-0.27, -0.38, 0)
    robotGroup.add(leftUpperLeg)
    const rightUpperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.126, 0.108, 0.57, 10), bodyMat)
    rightUpperLeg.position.set( 0.27, -0.38, 0)
    robotGroup.add(rightUpperLeg)

    // Knee joints
    const leftKnee = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 10), jointMat)
    leftKnee.position.set(-0.27, -0.7, 0)
    robotGroup.add(leftKnee)
    const rightKnee = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 10), jointMat)
    rightKnee.position.set( 0.27, -0.7, 0)
    robotGroup.add(rightKnee)

    // Lower legs
    const leftLowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.082, 0.54, 10), bodyMat)
    leftLowerLeg.position.set(-0.27, -1.0, 0)
    robotGroup.add(leftLowerLeg)
    const rightLowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.082, 0.54, 10), bodyMat)
    rightLowerLeg.position.set( 0.27, -1.0, 0)
    robotGroup.add(rightLowerLeg)

    // Feet
    const footGeo = new THREE.BoxGeometry(0.2, 0.095, 0.33)
    const leftFoot = new THREE.Mesh(footGeo, bodyMat)
    leftFoot.position.set(-0.27, -1.32, 0.04)
    robotGroup.add(leftFoot)
    const rightFoot = new THREE.Mesh(footGeo, bodyMat)
    rightFoot.position.set( 0.27, -1.32, 0.04)
    robotGroup.add(rightFoot)

    /* ─── PLATFORM ─── */
    // Glowing torus ring on ground
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.022, 8, 72), torusMat)
    torus.rotation.x = -Math.PI / 2
    torus.position.set(0, -1.4, 0)
    robotGroup.add(torus)

    // Secondary outer ring (dimmer)
    const torus2Mat = new THREE.MeshStandardMaterial({
      color: 0x001a0d,
      emissive: new THREE.Color(0x00ff88),
      emissiveIntensity: 0.3,
    })
    const torus2 = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.014, 8, 72), torus2Mat)
    torus2.rotation.x = -Math.PI / 2
    torus2.position.set(0, -1.4, 0)
    robotGroup.add(torus2)

    // Platform glow light
    const platformLight = new THREE.PointLight(0x00ff88, 0.55, 3.5)
    platformLight.position.set(0, -1.35, 0)
    robotGroup.add(platformLight)

    // Grid on platform
    const gridHelper = new THREE.GridHelper(2.0, 8, 0x003322, 0x001a11)
    gridHelper.position.set(0, -1.41, 0)
    robotGroup.add(gridHelper)

    /* ─── INPUT TRACKING ─── */
    let tRotX = 0
    let tRotY = 0
    let scrollY = 0

    const onMouse = (e: MouseEvent) => {
      tRotX = ((e.clientY / window.innerHeight) - 0.5) * 0.28
      tRotY = ((e.clientX / window.innerWidth)  - 0.5) * 0.38
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

    /* ─── ANIMATION ─── */
    let raf = 0
    let t = 0
    let headScanDir = 1

    const animate = () => {
      raf = requestAnimationFrame(animate)
      t += 0.016

      // ── Breathing: gentle torso Y scale ──
      const breath = 0.98 + Math.sin(t * 1.3) * 0.02
      torsoGroup.scale.set(1, breath, 1)

      // ── Head scan: slowly oscillate ±15° ──
      const headTarget = headScanDir * 0.26
      headGroup.rotation.y = lerp(headGroup.rotation.y, headTarget, 0.007)
      if (Math.abs(headGroup.rotation.y - headTarget) < 0.015) {
        headScanDir *= -1
      }

      // ── Arm sway ──
      const sway = Math.sin(t * 0.85) * 0.09
      leftArmGroup.rotation.x  =  sway
      rightArmGroup.rotation.x = -sway

      // ── Mouse parallax tilt ──
      robotGroup.rotation.x = lerp(robotGroup.rotation.x, tRotX, 0.05)
      robotGroup.rotation.y = lerp(robotGroup.rotation.y, tRotY, 0.05)

      // ── Eye + chest light pulse ──
      const pulse = 0.55 + Math.sin(t * 2.6) * 0.35
      eyeLightL.intensity   = pulse * 0.8
      eyeLightR.intensity   = pulse * 0.8
      chestLight.intensity  = pulse * 0.55
      platformLight.intensity = 0.4 + Math.sin(t * 1.8) * 0.15

      // ── Scroll: walk toward camera + fade ──
      const sf = Math.min(scrollY / 580, 1)
      outerGroup.position.z = lerp(outerGroup.position.z, sf * 3.2, 0.055)
      renderer.domElement.style.opacity = String(1 - sf * 0.88)

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
