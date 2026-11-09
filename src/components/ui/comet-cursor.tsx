/**
 * comet-cursor.tsx
 * Place at: src/components/ui/comet-cursor.tsx
 *
 * A cursor built from the same pieces as your logo and palette:
 *
 *  - gold core dot (the logo's gold dot) that sits exactly on the pointer
 *  - cyan satellite orbiting it (the logo's orbit)
 *  - a thin ring that lags behind with a soft spring
 *  - a gold → cyan comet trail that fades behind fast movement
 *  - over links and buttons the ring morphs into a glass outline around the
 *    element (like the navbar droplet), the satellite tucks away, and the
 *    core shrinks; clicking squeezes the ring and sends out a gold pulse
 *
 * Over the hero artwork it switches to a white "depth" cursor (core · morphing ring ·
 * slow outer ring, stretching with scroll speed, with a scroll chevron at the very top),
 * drawn with mix-blend-mode: difference so it reads on any artwork. It switches by
 * reading heroTheme.light, which the hero publishes.
 *
 * Only shown for mouse / fine pointers. Touch devices keep their normal behaviour.
 * With prefers-reduced-motion you get the dot and ring only: no trail, orbit or pulse.
 */
import { useEffect, useRef } from "react"

import { heroTheme } from "@/lib/hero-theme"
import { cn } from "@/lib/utils"

const INTERACTIVE =
  'a, button, [role="button"], summary, label[for], select, input, textarea, [data-cursor="hover"]'

const TRAIL_LIFE = 0.42 // seconds
const TRAIL_MAX = 48

type TrailPoint = { x: number; y: number; t: number }

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

export function CometCursor({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    // Touch / coarse pointers keep the native cursor
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Hide the native cursor everywhere while this one is active
    const style = document.createElement("style")
    style.textContent = "html.comet-cursor-on, html.comet-cursor-on * { cursor: none !important; }"
    document.head.appendChild(style)
    document.documentElement.classList.add("comet-cursor-on")

    let w = window.innerWidth
    let h = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // State
    const mouse = { x: -200, y: -200 }
    const ring = { x: -200, y: -200, w: 44, h: 44, r: 22 }
    const ringB = { x: -200, y: -200 } // slow outer ring of the hero's "depth" cursor
    const trail: TrailPoint[] = []
    let blendDiff = false // canvas currently uses mix-blend-mode: difference
    let scrollSpeed = 0 // px per frame, smoothed
    let lastScrollY = window.scrollY
    let seen = false // pointer has moved at least once
    let inside = true // pointer is inside the window
    let hoverEl: Element | null = null
    let vis = 0 // overall opacity, smoothed
    let magnet = 0 // 0 = free ring, 1 = snapped to an element
    let press = 0 // smoothed "mouse is down"
    let pressed = false
    let pulse = 0 // 1 → 0 after a click
    let angle = 0
    let first = true

    /* ---------- Events ---------- */
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      mouse.x = e.clientX
      mouse.y = e.clientY
      if (first) {
        // Don't sweep in from the corner on first movement
        ring.x = mouse.x
        ring.y = mouse.y
        ringB.x = mouse.x
        ringB.y = mouse.y
        first = false
      }
      seen = true
      inside = true
      const target = e.target as Element | null
      hoverEl = target?.closest?.(INTERACTIVE) ?? null
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      pressed = true
      if (!reduce) pulse = 1
    }
    const onUp = () => {
      pressed = false
    }
    const onLeave = () => {
      inside = false
    }
    const onEnter = () => {
      inside = true
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    window.addEventListener("pointercancel", onUp, { passive: true })
    window.addEventListener("resize", resize)
    document.documentElement.addEventListener("mouseleave", onLeave)
    document.documentElement.addEventListener("mouseenter", onEnter)

    /* ---------- Render loop ---------- */
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const k = (rate: number) => (reduce ? 1 : 1 - Math.exp(-dt * rate))

      vis += ((seen && inside ? 1 : 0) - vis) * k(14)
      const light = heroTheme.light // 1 over the light hero: swap glow-on-dark colours for ink/teal
      const tealG = 243 - 123 * light
      const tealB = 255 - 105 * light

      // Over the hero artwork (published by the hero via heroTheme) the cursor becomes a
      // white "depth" cursor drawn with mix-blend-mode: difference, so it stays visible
      // on any artwork, light or dark. 0 = normal page, 1 = fully in hero mode.
      const hero = Math.min(1, light / 0.55)
      const diff = hero > 0.02
      if (diff !== blendDiff) {
        blendDiff = diff
        canvas.style.mixBlendMode = diff ? "difference" : "normal"
      }
      const sy = window.scrollY
      scrollSpeed += (Math.abs(sy - lastScrollY) - scrollSpeed) * k(8)
      lastScrollY = sy
      ringB.x += (mouse.x - ringB.x) * k(6)
      ringB.y += (mouse.y - ringB.y) * k(6)

      // Where should the ring be? Free: around the pointer. Hovering: around the element.
      let tx = mouse.x
      let ty = mouse.y
      let tw = 44
      let th = 44
      let tr = 22
      let wantMagnet = 0

      if (hoverEl && hoverEl.isConnected) {
        const r = hoverEl.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          const pad = 6
          tw = r.width + pad * 2
          th = r.height + pad * 2
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          tx = cx + (mouse.x - cx) * 0.12 // slight pull toward the pointer
          ty = cy + (mouse.y - cy) * 0.12
          tr = Math.min(14, th / 2)
          wantMagnet = 1
        }
      }

      magnet += (wantMagnet - magnet) * k(12)
      const lk = k(wantMagnet ? 16 : 11)
      ring.x += (tx - ring.x) * lk
      ring.y += (ty - ring.y) * lk
      ring.w += (tw - ring.w) * lk
      ring.h += (th - ring.h) * lk
      ring.r += (tr - ring.r) * lk

      press += ((pressed ? 1 : 0) - press) * k(20)
      pulse = Math.max(0, pulse - dt * 1.8)
      angle += dt * 3.2

      // Trail
      if (!reduce) {
        const tail = trail[trail.length - 1]
        if (seen && inside && (!tail || Math.hypot(mouse.x - tail.x, mouse.y - tail.y) > 2)) {
          trail.push({ x: mouse.x, y: mouse.y, t: now })
          if (trail.length > TRAIL_MAX) trail.shift()
        }
        while (trail.length && (now - trail[0].t) / 1000 > TRAIL_LIFE) trail.shift()
      }

      /* ---------- Draw ---------- */
      ctx.clearRect(0, 0, w, h)
      if (vis < 0.01 && trail.length === 0) return

      // Comet trail: gold at the head, cyan toward the tail
      if (trail.length > 1) {
        ctx.save()
        ctx.globalCompositeOperation = light > 0.5 ? "source-over" : "lighter"
        ctx.lineCap = "round"
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1]
          const b = trail[i]
          const life = Math.max(0, 1 - (now - b.t) / 1000 / TRAIL_LIFE)
          const R = Math.round(255 * life)
          const G = Math.round(tealG + (140 - tealG) * life)
          const B = Math.round(tealB * (1 - life))
          ctx.strokeStyle = `rgba(${R},${G},${B},${(life * (0.55 + 0.25 * light) * (1 - magnet * 0.75) * vis * (1 - hero)).toFixed(3)})`
          ctx.lineWidth = 0.8 + 4.2 * life
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
        ctx.restore()
      }

      ctx.globalAlpha = vis * (1 - hero)

      // Ring (squeezes slightly while pressed)
      const squeeze = 1 - press * 0.1
      ctx.save()
      ctx.translate(ring.x, ring.y)
      ctx.scale(squeeze, squeeze)
      ctx.beginPath()
      roundedRect(ctx, -ring.w / 2, -ring.h / 2, ring.w, ring.h, ring.r)
      ctx.fillStyle = `rgba(0,243,255,${(0.07 * magnet).toFixed(3)})`
      ctx.fill()
      const baseR = 238 - (238 - 22) * light
      const baseG = 241 - (241 - 22) * light
      const baseB = 250 - (250 - 34) * light
      const magG = 243 - 103 * light
      const magB = 255 - 90 * light
      const sr = Math.round(baseR * (1 - magnet))
      const sg = Math.round(baseG + (magG - baseG) * magnet)
      const sb = Math.round(baseB + (magB - baseB) * magnet)
      ctx.strokeStyle = `rgba(${sr},${sg},${sb},${Math.min(1, 0.26 + 0.24 * light + 0.6 * magnet).toFixed(3)})`
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.restore()

      // Click pulse
      if (pulse > 0) {
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 10 + (1 - pulse) * 38, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255,140,0,${(pulse * 0.55).toFixed(3)})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Satellite (the logo's cyan orbit); tucks away over interactive elements
      const orbitAlpha = reduce ? 0 : 1 - magnet
      const satG = Math.round(243 - 103 * light)
      const satB = Math.round(255 - 90 * light)
      if (orbitAlpha > 0.01) {
        const ox = mouse.x + Math.cos(angle) * 12
        const oy = mouse.y + Math.sin(angle) * 12
        const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 7)
        glow.addColorStop(0, `rgba(0,${satG},${satB},${(0.5 * orbitAlpha).toFixed(3)})`)
        glow.addColorStop(1, `rgba(0,${satG},${satB},0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(ox, oy, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(0,${satG},${satB},${orbitAlpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(ox, oy, 1.9, 0, Math.PI * 2)
        ctx.fill()
      }

      // Core (the logo's gold dot)
      const coreR = 3.4 * (1 - magnet * 0.45) * (1 - press * 0.3)
      const coreGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 16)
      coreGlow.addColorStop(0, `rgba(255,140,0,${(0.38 * (1 - magnet * 0.6)).toFixed(3)})`)
      coreGlow.addColorStop(1, "rgba(255,140,0,0)")
      ctx.fillStyle = coreGlow
      ctx.beginPath()
      ctx.arc(mouse.x, mouse.y, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#ff8c00"
      ctx.beginPath()
      ctx.arc(mouse.x, mouse.y, coreR, 0, Math.PI * 2)
      ctx.fill()

      /* ---------- Hero "depth" cursor ----------
         Three layers that lag by different amounts, like the hero's parallax layers:
         core (no lag) · ring that morphs onto links · slow outer ring.
         Scrolling stretches the rings along the scroll axis; at the very top a small
         chevron hints "scroll". White + difference blending = visible on any artwork. */
      if (hero > 0.01) {
        const a = vis * hero
        const TAU = Math.PI * 2
        ctx.globalAlpha = 1

        // White trail
        if (trail.length > 1) {
          ctx.lineCap = "round"
          for (let i = 1; i < trail.length; i++) {
            const t0 = trail[i - 1]
            const t1 = trail[i]
            const life = Math.max(0, 1 - (now - t1.t) / 1000 / TRAIL_LIFE)
            ctx.strokeStyle = `rgba(255,255,255,${(life * 0.45 * (1 - magnet * 0.75) * a).toFixed(3)})`
            ctx.lineWidth = 0.8 + 3.2 * life
            ctx.beginPath()
            ctx.moveTo(t0.x, t0.y)
            ctx.lineTo(t1.x, t1.y)
            ctx.stroke()
          }
        }

        const stretch = 1 + Math.min(scrollSpeed * 0.03, 0.7)

        // Slow outer ring (stretches with scroll speed)
        ctx.save()
        ctx.translate(ringB.x, ringB.y)
        ctx.scale(1, stretch)
        ctx.beginPath()
        ctx.arc(0, 0, 30, 0, TAU)
        ctx.strokeStyle = `rgba(255,255,255,${(0.5 * a * (1 - magnet)).toFixed(3)})`
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()

        // Mid ring: the same morphing ring, now white
        ctx.save()
        ctx.translate(ring.x, ring.y)
        ctx.scale(squeeze, squeeze * (1 + Math.min(scrollSpeed * 0.02, 0.4)))
        ctx.beginPath()
        roundedRect(ctx, -ring.w / 2, -ring.h / 2, ring.w, ring.h, ring.r)
        ctx.fillStyle = `rgba(255,255,255,${(0.08 * magnet * a).toFixed(3)})`
        ctx.fill()
        ctx.strokeStyle = `rgba(255,255,255,${(0.85 * a).toFixed(3)})`
        ctx.lineWidth = 1.3
        ctx.stroke()
        ctx.restore()

        // Click pulse
        if (pulse > 0) {
          ctx.beginPath()
          ctx.arc(mouse.x, mouse.y, 14 + (1 - pulse) * 44, 0, TAU)
          ctx.strokeStyle = `rgba(255,255,255,${(pulse * 0.6 * a).toFixed(3)})`
          ctx.lineWidth = 1.4
          ctx.stroke()
        }

        // Scroll hint: a bobbing chevron under the outer ring, only near the top of the page
        const cue = Math.max(0, 1 - sy / 80) * (1 - magnet)
        if (cue > 0.02 && !reduce) {
          const cy = ringB.y + 30 * stretch + 16 + Math.sin(now / 280) * 3
          ctx.beginPath()
          ctx.moveTo(ringB.x - 5, cy - 3)
          ctx.lineTo(ringB.x, cy + 2)
          ctx.lineTo(ringB.x + 5, cy - 3)
          ctx.strokeStyle = `rgba(255,255,255,${(0.8 * cue * a).toFixed(3)})`
          ctx.lineWidth = 1.5
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.stroke()
        }

        // Core
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 3.2 * (1 - magnet * 0.4) * (1 - press * 0.3), 0, TAU)
        ctx.fill()
      }

      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(frame)

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      window.removeEventListener("resize", resize)
      document.documentElement.removeEventListener("mouseleave", onLeave)
      document.documentElement.removeEventListener("mouseenter", onEnter)
      document.removeEventListener("visibilitychange", onVisibility)
      document.documentElement.classList.remove("comet-cursor-on")
      style.remove()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 z-[1000] h-full w-full", className)}
    />
  )
}

export default CometCursor