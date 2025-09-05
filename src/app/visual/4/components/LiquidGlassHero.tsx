'use client'

import { useEffect, useRef } from 'react'
import FlameSmokeBackground from './FlameSmokeBackground'

function FlameField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })!

    let raf = 0
    const DPR = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window
      // Low-res internal buffer for soft, smoky look
      const scale = 0.45
      canvas.width = Math.max(240, Math.floor(w * scale))
      canvas.height = Math.max(160, Math.floor(h * scale))
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
    }
    resize()
    window.addEventListener('resize', resize)

    // Perlin-like value noise helpers
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const fade = (t: number) => t * t * (3 - 2 * t)
    const random = (x: number, y: number) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
      return s - Math.floor(s)
    }
    const noise2D = (x: number, y: number) => {
      const xi = Math.floor(x), yi = Math.floor(y)
      const xf = x - xi, yf = y - yi
      const tl = random(xi, yi)
      const tr = random(xi + 1, yi)
      const bl = random(xi, yi + 1)
      const br = random(xi + 1, yi + 1)
      const u = fade(xf), v = fade(yf)
      return lerp(lerp(tl, tr, u), lerp(bl, br, u), v)
    }

    const fbm = (x: number, y: number) => {
      let value = 0
      let amp = 0.5
      let freq = 1.0
      for (let i = 0; i < 5; i++) {
        value += amp * noise2D(x * freq, y * freq)
        freq *= 2.0
        amp *= 0.5
      }
      return value
    }

    const img = ctx.createImageData(canvas.width, canvas.height)

    let t = 0
    const loop = () => {
      t += 0.003
      const w = canvas.width
      const h = canvas.height
      const data = img.data

      // render low-res field with domain warp for visible flames
      let idx = 0
      const scale = 1.6 / Math.min(w, h) // larger features
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x * scale
          const ny = y * scale
          // domain warp
          const qx = fbm(nx * 1.8 + t * 1.1, ny * 1.8 - t * 1.1)
          const qy = fbm(nx * 1.8 - t * 0.9, ny * 1.8 + t * 0.9)
          const v = fbm(nx + 2.0 * qx, ny + 2.0 * qy)

          // palette mapping: vivid flame-like gradient
          const c1 = [255, 92, 0]     // orange
          const c2 = [168, 85, 247]   // violet
          const c3 = [56, 189, 248]   // cyan
          const c4 = [99, 102, 241]   // indigo

          // mix across bands
          const a = Math.max(0, Math.min(1, v * 1.4 - 0.1))
          const b = Math.max(0, Math.min(1, v * 1.2))
          const m1 = [
            Math.round(lerp(c1[0], c2[0], a)),
            Math.round(lerp(c1[1], c2[1], a)),
            Math.round(lerp(c1[2], c2[2], a)),
          ]
          const m2 = [
            Math.round(lerp(c3[0], c4[0], b)),
            Math.round(lerp(c3[1], c4[1], b)),
            Math.round(lerp(c3[2], c4[2], b)),
          ]
          const mixT = 0.5 + 0.5 * Math.sin((nx + ny) * 1.5 + t * 1.2)
          const r = Math.round(lerp(m1[0], m2[0], mixT))
          const g = Math.round(lerp(m1[1], m2[1], mixT))
          const bcol = Math.round(lerp(m1[2], m2[2], mixT))

          data[idx++] = r
          data[idx++] = g
          data[idx++] = bcol
          // strong yet not opaque alpha; letting glass do the blur
          data[idx++] = 200 // 0..255
        }
      }

      ctx.putImageData(img, 0, 0)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="absolute inset-0 -z-30" style={{ filter: 'blur(36px) saturate(185%) contrast(115%)' }} />
  )
}

export default function LiquidGlassHero() {
  const rootRef = useRef<HTMLDivElement>(null)

  // Simple mouse parallax using CSS variables
  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const handle = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el.style.setProperty('--px', String(x))
      el.style.setProperty('--py', String(y))
    }

    // Reduced motion: freeze parallax
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!media.matches) {
      window.addEventListener('pointermove', handle)
    }
    return () => window.removeEventListener('pointermove', handle)
  }, [])

  return (
    <section
      ref={rootRef}
      className="relative isolate min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-200 text-neutral-900"
      style={{
        // default parallax values
        // @ts-expect-error CSS variables typed as string
        '--px': 0,
        '--py': 0,
      }}
    >
      {/* Background wispy color field (GPU shader) */}
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <FlameSmokeBackground />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.06)_55%,rgba(0,0,0,0.15)_100%)]" />
      </div>

      {/* Foreground: rounded container with internal glass panels */}
      <div
        className="relative z-10 w-[min(1180px,92vw)] aspect-[16/9] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
        style={{
          transform:
            'translate3d(calc(var(--px)*12px), calc(var(--py)*12px), 0)',
          transition: 'transform 180ms ease-out',
        }}
      >
        {/* Panel grid overlay creates seams inside the glass */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="panel"
              style={{
                // subtle per-panel parallax
                transform:
                  'translate3d(calc(var(--px)*6px), calc(var(--py)*6px), 0)',
              }}
            />
          ))}
        </div>

        {/* Grid seam lines + overall container gloss */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-45"
               style={{
                 backgroundImage:
                   'repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0 1px, rgba(255,255,255,0) 1px 33.333%),\
                     repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 1px, rgba(255,255,255,0) 1px 25%)',
                 backdropFilter: 'none',
               }} />
          {/* rounded container edge highlight */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
               style={{
                 boxShadow:
                   'inset 0 0 0 1px rgba(255,255,255,0.55), inset 0 1px 55px rgba(255,255,255,0.28), inset 0 -25px 80px rgba(255,255,255,0.22)',
               }}
          />
          {/* moving gloss sweep */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute -inset-x-1 -top-1/2 h-[200%] opacity-35"
                 style={{
                   background:
                     'linear-gradient(35deg, rgba(255,255,255,0.0) 30%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.0) 60%)',
                   filter: 'blur(18px)',
                   animation: 'sweep 9s ease-in-out infinite',
                 }} />
          </div>
        </div>
      </div>

      {/* Hero content above panels */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        <div className="pointer-events-auto px-8 text-center" style={{
          transform:
            'translate3d(calc(var(--px)*8px), calc(var(--py)*8px), 0)',
          transition: 'transform 200ms ease-out',
        }}>
          <h1 className="text-5xl md:text-7xl font-[350] tracking-[-0.02em] text-slate-300">
            atlasgrid
          </h1>
          <p className="mt-5 text-neutral-700/80 text-lg md:text-xl max-w-3xl mx-auto">
            oleg
          </p>
          <div className="mt-8 inline-flex items-center gap-3">
            <button className="rounded-full px-6 py-3 text-sm font-medium text-neutral-600 bg-white/80 shadow-sm border border-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/45 hover:bg-white/70 transition-colors">
              Start a Free Trial
            </button>
            <button className="rounded-full px-6 py-3 text-sm font-medium text-neutral-500 bg-white/50 border border-white/60 backdrop-blur hover:bg-white/40 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Local styles for the effect */}
      <style jsx>{`
        @keyframes sweep {
          0% { transform: translateX(-40%) rotate(0.001deg); }
          50% { transform: translateX(40%) rotate(0.001deg); }
          100% { transform: translateX(-40%) rotate(0.001deg); }
        }

        /* Individual glass panels */
        .panel {
          position: relative;
          backdrop-filter: blur(26px) saturate(180%) contrast(112%);
          -webkit-backdrop-filter: blur(26px) saturate(180%) contrast(112%);
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.26) 0%,
            rgba(255,255,255,0.18) 100%
          );
          border: 1px solid rgba(255,255,255,0.55);
        }
        .panel::before {
          /* inner highlight */
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -1px 0 rgba(255,255,255,0.45);
        }
        .panel::after {
          /* subtle liquid glass curvature shine */
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%),
                      radial-gradient(120% 60% at 50% 110%, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%);
          opacity: 0.6;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .blob { animation: none; }
        }
      `}</style>
    </section>
  )
}
