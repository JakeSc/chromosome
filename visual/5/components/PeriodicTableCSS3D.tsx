"use client"

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

// Color constants
const CARD_RGB = '71,51,255' // card background base color (R,G,B)
const BORDER_RGB = '0,0,255' // card border/accent color (R,G,B)

// Layout + tween typing helpers
type LayoutKey = 'table' | 'sphere' | 'helix' | 'grid'
type Targets = Record<LayoutKey, THREE.Object3D[]>

type EasingFn = (k: number) => number
type TweenLike<T extends object> = {
  to(props: Partial<T>, duration: number): TweenLike<T>
  easing(fn: EasingFn): TweenLike<T>
  start(): TweenLike<T>
  onUpdate(cb: () => void): TweenLike<T>
}
type TweenStatic = {
  removeAll(): void
  Easing: { Exponential: { InOut: EasingFn } }
  Tween: new <T extends object>(obj: T) => TweenLike<T>
}
const Tw = TWEEN as unknown as TweenStatic

const table: (string | number)[] = [
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
  '', 'Oleg', 'atlasgrid', 0, 0,
]

export default function PeriodicTableCSS3D() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<CSS3DRenderer | null>(null)
  const controlsRef = useRef<TrackballControls | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const objectsRef = useRef<CSS3DObject[]>([])
  const targetsRef = useRef<Targets>({ table: [], sphere: [], helix: [], grid: [] })
  const rafRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const [currentMode, setCurrentMode] = useState<Exclude<LayoutKey, 'table'> | null>(null)

  const layoutSequence: Array<Exclude<LayoutKey, 'table'>> = ['sphere', 'helix', 'grid']

  useEffect(() => {
    if (!mountRef.current) return
    const mountEl = mountRef.current

    // Setup camera, scene, renderer
    const camera = new THREE.PerspectiveCamera(40, mountRef.current.clientWidth / mountRef.current.clientHeight, 1, 10000)
    camera.position.z = 3000
    cameraRef.current = camera

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const objects: CSS3DObject[] = []
    const targets: Targets = { table: [], sphere: [], helix: [], grid: [] }

    // Build 100 cards from the `table` data (hide numbers)
    const count = Math.min(Math.floor(table.length / 5), 100)

    for (let idx = 0; idx < count; idx++) {
      const base = idx * 5
      const element = document.createElement('div')
      element.className = 'element'
      element.style.backgroundColor = `rgba(${CARD_RGB},${Math.random() * 0.5 + 0.25})`

      // No inner text/content – render as a glassy card only

      const objectCSS = new CSS3DObject(element)
      objectCSS.position.x = Math.random() * 4000 - 2000
      objectCSS.position.y = Math.random() * 4000 - 2000
      objectCSS.position.z = Math.random() * 4000 - 2000
      scene.add(objectCSS)
      objects.push(objectCSS)

      // Stack target: all cards share same x/y (and z) to overlap
      const object = new THREE.Object3D()
      object.position.set(0, 0, 0)
      targets.table.push(object)
    }

    // Sphere targets
    const vector = new THREE.Vector3()
    for (let i = 0, l = objects.length; i < l; i++) {
      const phi = Math.acos(-1 + (2 * i) / l)
      const theta = Math.sqrt(l * Math.PI) * phi

      const object = new THREE.Object3D()
      object.position.setFromSphericalCoords(800, phi, theta)
      vector.copy(object.position).multiplyScalar(2)
      object.lookAt(vector)
      targets.sphere.push(object)
    }

    // Helix targets
    for (let i = 0, l = objects.length; i < l; i++) {
      const theta = i * 0.175 + Math.PI
      const y = -(i * 8) + 450

      const object = new THREE.Object3D()
      object.position.setFromCylindricalCoords(900, theta, y)
      vector.x = object.position.x * 2
      vector.y = object.position.y
      vector.z = object.position.z * 2
      object.lookAt(vector)
      targets.helix.push(object)
    }

    // Grid targets (keep a nice 5x5xN layout)
    for (let i = 0; i < objects.length; i++) {
      const object = new THREE.Object3D()
      object.position.x = ((i % 5) * 400) - 800
      object.position.y = (-(Math.floor(i / 5) % 5) * 400) + 800
      object.position.z = Math.floor(i / 25) * 1000 - 2000
      targets.grid.push(object)
    }

    // Renderer
    const renderer = new CSS3DRenderer()
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight)
    mountEl.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new TrackballControls(camera, renderer.domElement)
    controls.minDistance = 500
    controls.maxDistance = 6000
    controls.addEventListener('change', render)
    controlsRef.current = controls

    // Store refs
    objectsRef.current = objects
    targetsRef.current = targets

    // Initial layout (Stack)
    transform(targets.table, 2000)

    // Auto-cycle between Sphere → Helix → Grid every 5s (start after initial Stack)
    let seqIndex = 0
    timeoutRef.current = window.setTimeout(() => {
      const key = layoutSequence[seqIndex]
      transform(targets[key], 2000)
      setCurrentMode(key)
      seqIndex = (seqIndex + 1) % layoutSequence.length
      intervalRef.current = window.setInterval(() => {
        const k = layoutSequence[seqIndex]
        transform(targets[k], 2000)
        setCurrentMode(k)
        seqIndex = (seqIndex + 1) % layoutSequence.length
      }, 5000)
    }, 5000)

    function onWindowResize() {
      if (!cameraRef.current || !rendererRef.current) return
      const { clientWidth, clientHeight } = mountEl
      cameraRef.current.aspect = clientWidth / clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(clientWidth, clientHeight)
      render()
    }

    window.addEventListener('resize', onWindowResize)

    function animate() {
      TWEEN.update()
      controls.update()
      render()
      rafRef.current = requestAnimationFrame(animate)
    }

    function render() {
      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }
    }

    animate()

    return () => {
      window.removeEventListener('resize', onWindowResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      controls.dispose()
      if (renderer.domElement && mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement)
      }
      // Clear scene objects
      objects.forEach(obj => scene.remove(obj))
    }
  }, [])

  function transform(targets: THREE.Object3D[], duration: number) {
    const objects = objectsRef.current

    Tw.removeAll()

    for (let i = 0; i < objects.length; i++) {
      const object = objects[i]
      const target = targets[i]

      new Tw.Tween<THREE.Vector3>(object.position)
        .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
        .easing(Tw.Easing.Exponential.InOut)
        .start()

      new Tw.Tween<THREE.Euler>(object.rotation as unknown as THREE.Euler)
        .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
        .easing(Tw.Easing.Exponential.InOut)
        .start()
    }

    new Tw.Tween<Record<string, never>>({})
      .to({}, duration * 2)
      .onUpdate(() => {
        // trigger rerender via controls listener or direct render
        const renderer = rendererRef.current
        const scene = sceneRef.current
        const camera = cameraRef.current
        if (renderer && scene && camera) renderer.render(scene, camera)
      })
      .start()
  }

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden" ref={mountRef}>
      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-3 z-10 select-none">
        {layoutSequence.map((key) => (
          <span
            key={key}
            aria-hidden="true"
            className={`pip ${currentMode === key ? 'pip-active' : ''}`}
          />
        ))}
      </div>

      {/* Global styles to match the original example */}
      <style jsx global>{`
        .element {
          width: 120px;
          height: 160px;
          box-shadow: 0px 0px 12px rgba(0,255,255,0.5);
          border: 1px solid rgba(${BORDER_RGB},0.25);
          font-family: Helvetica, Arial, sans-serif;
          text-align: center;
          line-height: normal;
          cursor: default;
          position: relative;
        }
        .element:hover {
          box-shadow: 0px 0px 12px rgba(0,255,255,0.75);
          border: 1px solid rgba(${BORDER_RGB},0.75);
        }
        /* No inner text for cards */
        .pip {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background-color: rgba(${BORDER_RGB}, 0.5);
          transition: all 350ms ease;
        }
        .pip-active {
          width: 40px;
          height: 8px;
          border-radius: 9999px;
          background-color: rgba(${BORDER_RGB}, 0.9);
        }
      `}</style>
    </div>
  )
}
