/**
 * cosmic-backdrop.tsx
 * Place at: src/components/cosmic-backdrop.tsx
 *
 * The one starfield for the whole page: your original interactive 2D field
 * (drift, twinkle, cursor repulsion), now fixed behind EVERYTHING, including
 * the hero. The hero's WebGL canvas is transparent, so these same stars show
 * through it and carry on unbroken as you scroll into the sections.
 *
 * It never pauses on scroll (only when the tab is hidden, or for
 * prefers-reduced-motion). Scrolling adds a gentle depth parallax: bigger
 * (closer) stars drift down faster, matching the hero's "climbing out of the
 * ridges into space" motion.
 */
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

const TAU = Math.PI * 2
const PALETTE = ["255,255,255", "160,220,255", "255,196,120"] as const // white, cyan-blue, amber

type Star = {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  r: number
  depth: number // scroll parallax factor
  alphaBase: number
  twinkleSpeed: number
  phase: number
  rgb: string
}

export function CosmicBackdrop({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const lowPower = (navigator.hardwareConcurrency || 4) <= 4

    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let stars: Star[] = []
    const mouse = { x: width / 2, y: height / 2, active: false }

    let scrollTarget = window.scrollY
    let scrollSmooth = scrollTarget

    // Wrap a y position into the visible band (with a 20px margin either side)
    const wrapY = (v: number) => {
      const band = height + 40
      return ((((v + 20) % band) + band) % band) - 20
    }
    const shiftOf = (s: Star) => (reduceMotion ? 0 : scrollSmooth * s.depth)

    const createStars = () => {
      // Slightly denser than the original: this is now the only star layer, hero included
      let count = Math.round((width * height) / 7500)
      count = Math.max(100, Math.min(count, 190))
      if (lowPower) count = Math.round(count * 0.7)

      stars = Array.from({ length: count }, () => {
        const x = Math.random() * width
        const y = Math.random() * height
        const roll = Math.random()
        const r = 0.7 + Math.random() * 1.7
        return {
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
          r,
          depth: 0.05 + (r / 2.4) * 0.1, // 0.05 – 0.15 px of drift per px scrolled
          alphaBase: 0.35 + Math.random() * 0.6,
          twinkleSpeed: 0.4 + Math.random() * 1.5,
          phase: Math.random() * TAU,
          rgb: roll < 0.72 ? PALETTE[0] : roll < 0.9 ? PALETTE[1] : PALETTE[2],
        }
      })
    }

    const resizeCanvas = (rebuild = true) => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (rebuild) createStars()
    }

    const update = (dt: number) => {
      const repelRadius = 130
      const repelStrength = 0.9
      const spring = 0.012
      const stepScale = dt / 16.67 // frame-rate independent

      // Ease toward the real scroll position so parallax glides instead of jittering
      scrollSmooth += (scrollTarget - scrollSmooth) * (1 - Math.exp(-dt / 120))

      for (const s of stars) {
        s.baseX += s.vx * stepScale
        s.baseY += s.vy * stepScale
        if (s.baseX < -20) s.baseX = width + 20
        if (s.baseX > width + 20) s.baseX = -20
        if (s.baseY < -20) s.baseY = height + 20
        if (s.baseY > height + 20) s.baseY = -20

        if (mouse.active) {
          const dx = s.x - mouse.x
          const dy = wrapY(s.y + shiftOf(s)) - mouse.y // compare in on-screen space
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.001
          if (dist < repelRadius) {
            const force = (1 - dist / repelRadius) * repelStrength
            s.x += (dx / dist) * force * stepScale
            s.y += (dy / dist) * force * stepScale
          }
        }

        s.x += (s.baseX - s.x) * spring * stepScale
        s.y += (s.baseY - s.y) * spring * stepScale
      }
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height)
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(now * 0.0016 * s.twinkleSpeed + s.phase)
        const alpha = s.alphaBase * (0.4 + 0.6 * twinkle)
        ctx.beginPath()
        ctx.fillStyle = `rgba(${s.rgb},${alpha.toFixed(3)})`
        ctx.arc(s.x, wrapY(s.y + shiftOf(s)), s.r, 0, TAU)
        ctx.fill()
      }
    }

    /* Single rAF handle. Runs for the whole life of the page (not just the hero). */
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(now - last, 48)
      last = now
      update(dt)
      draw(now)
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (raf || reduceMotion || document.hidden) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const onMouseLeave = () => {
      mouse.active = false
    }
    const onScroll = () => {
      scrollTarget = window.scrollY
    }
    let resizeTimer: number | undefined
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const rebuild = window.innerWidth !== width || Math.abs(window.innerHeight - height) > 120
        resizeCanvas(rebuild)
        if (!raf) draw(performance.now()) // resizing clears the canvas
      }, 150)
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    window.addEventListener("mousemove", onMouseMove, { passive: true })
    document.documentElement.addEventListener("mouseleave", onMouseLeave)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    document.addEventListener("visibilitychange", onVisibility)

    resizeCanvas()
    draw(0)
    start()

    return () => {
      stop()
      window.clearTimeout(resizeTimer)
      window.removeEventListener("mousemove", onMouseMove)
      document.documentElement.removeEventListener("mouseleave", onMouseLeave)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10 bg-[#05050a]", className)}
    />
  )
}

export default CosmicBackdrop
