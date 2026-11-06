/**
 * horizon-hero-section.tsx
 * Place at: src/components/ui/horizon-hero-section.tsx
 *
 * Apoorv Mishra: hero section.
 * Copy, colors and structure are taken from the original Portfolio.zip
 * (index.html + style.css). The one memorable moment is the horizon:
 * a gold glow rises behind three mountain ridges while the name wipes in,
 * and scrolling lifts the camera up out of the ridges into space.
 * The canvas is transparent: the stars are the page-wide <CosmicBackdrop />,
 * so the hero and the sections below share one continuous sky.
 *
 * Requires: npm install gsap three && npm install -D @types/three
 */
import { useLayoutEffect, useRef, type ReactNode } from "react"
import * as THREE from "three"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

/* -------------------------------------------------------------------------
   Content: verbatim from the original site (edit here, nowhere else)
   ------------------------------------------------------------------------- */
const CONTENT = {
  eyebrow: "Backend & Systems Engineer · AI/ML",
  name: "Apoorv Mishra",
  location: "Dehradun, India", // original meta description says Chandigarh; confirm which you want
  description:
    "Driven by curiosity about high-load systems. Currently learning to reason about threads, locks, and distributed state, aiming to bridge the gap between application logic and rock-solid infrastructure !",
  primaryCta: { label: "View projects", href: "#projects" },
  secondaryCta: { label: "Get in touch", href: "#contact" },
  github: "https://github.com/apoorv-git-code",
  linkedin: "https://linkedin.com/in/apoorv-mishra07",
} as const

/* -------------------------------------------------------------------------
   Brand tokens: from :root in the original style.css
   ------------------------------------------------------------------------- */
const BRAND = {
  void: "#05050a",
  voidAlt: "#08080f",
  text: "#eef1fa",
  textMuted: "#9aa3ba",
  gold: "#ff8c00",
  goldLight: "#ffb454",
  cyan: "#00f3ff",
  borderGlass: "rgba(255,255,255,0.09)",
} as const

const FONT = {
  display: '"Space Grotesk", "Inter", sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
} as const

/* -------------------------------------------------------------------------
   Scene constants
   ------------------------------------------------------------------------- */
const FOV = 55
const CAM_Y = 1
const CAM_Z0 = 8 // camera start
const CAM_TRAVEL = 9 // how far forward the camera flies over the full scroll
const CAM_RISE = 2.4 // how far the camera climbs over the full scroll

/** Each ridge is placed by screen fraction (0 = bottom, 1 = top) so the
 *  composition holds on any viewport. Amplitude is a fraction of visible height. */
const RIDGES = [
  { z: -34, frac: 0.3, amp: 0.07, seed: 1.3, color: "#0b0b17", rim: BRAND.gold, rimOpacity: 0.55 },
  { z: -22, frac: 0.2, amp: 0.075, seed: 4.1, color: "#080811", rim: BRAND.cyan, rimOpacity: 0.28 },
  { z: -13, frac: 0.1, amp: 0.08, seed: 7.7, color: BRAND.void, rim: null, rimOpacity: 0 },
] as const

const halfHeightAt = (distance: number) =>
  Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * distance
/** World-space Y that lands at `frac` of the screen height for a plane `distance` away. */
const yAtFraction = (distance: number, frac: number) =>
  CAM_Y + (frac * 2 - 1) * halfHeightAt(distance)

/* -------------------------------------------------------------------------
   Three.js helpers
   ------------------------------------------------------------------------- */
function makeGlowTexture(rgb: string): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const g = canvas.getContext("2d")!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, `rgba(${rgb},1)`)
  grad.addColorStop(0.35, `rgba(${rgb},0.35)`)
  grad.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const ridged = (t: number) => 1 - Math.abs(Math.sin(t))

function makeRidge(heightScale: number, seed: number) {
  const half = 160
  const step = 0.8
  const points: THREE.Vector3[] = []
  for (let x = -half; x <= half; x += step) {
    const n =
      0.55 * ridged(x * 0.045 + seed) +
      0.3 * ridged(x * 0.12 + seed * 1.7) +
      0.15 * ridged(x * 0.33 + seed * 2.3)
    points.push(new THREE.Vector3(x, n * heightScale, 0))
  }
  const shape = new THREE.Shape()
  shape.moveTo(-half, -heightScale * 6)
  points.forEach((p) => shape.lineTo(p.x, p.y))
  shape.lineTo(half, -heightScale * 6)
  shape.closePath()
  return { geometry: new THREE.ShapeGeometry(shape), points }
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj) => {
    const o = obj as THREE.Object3D & {
      geometry?: THREE.BufferGeometry
      material?: THREE.Material | THREE.Material[]
    }
    o.geometry?.dispose()
    const materials = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
    materials.forEach((m) => {
      ;(m as THREE.Material & { map?: THREE.Texture | null }).map?.dispose()
      m.dispose()
    })
  })
}

/* -------------------------------------------------------------------------
   Component
   ------------------------------------------------------------------------- */
export function HorizonHeroSection({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!section || !stage || !canvas) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const finePointer = window.matchMedia("(pointer: fine)").matches

    // Shared, GSAP-driven state read by the render loop
    const state = { progress: 0, dawn: reduceMotion ? 1 : 0 }
    const mouse = { x: 0, y: 0, cx: 0, cy: 0 }

    let teardownScene: (() => void) | undefined

    /* ---------- Text + scroll choreography (GSAP) ---------- */
    const ctx = gsap.context(() => {
      if (!reduceMotion) {
        // One orchestrated entrance: the name wipes in as the glow rises
        const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.25 })
        tl.to(state, { dawn: 1, duration: 2.6, ease: "power2.out" }, 0)
          .fromTo(
            ".hz-name",
            { clipPath: "inset(0 0 100% 0)", y: 36, letterSpacing: "0.06em" },
            {
              clipPath: "inset(0 0 0% 0)",
              y: 0,
              letterSpacing: "-0.02em",
              duration: 1.3,
              clearProps: "clipPath",
            },
            0.35,
          )
          .from(
            ".hz-fade",
            { opacity: 0, duration: 0.9, stagger: 0.12, ease: "power1.out" },
            1.0,
          )

        // Scroll: lift the camera
        gsap.to(state, {
          progress: 1,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.8 },
        })

        // Scroll: copy and cue leave early so the sky can take over
        gsap.to(copyRef.current, {
          opacity: 0,
          y: -60,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "28% top", scrub: true },
        })
        gsap.to(cueRef.current, {
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "6% top", scrub: true },
        })
      }
    }, section)

    /* ---------- WebGL scene (Three.js) ---------- */
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0) // transparent: the page-wide starfield shows through

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200)

      // Horizon glow: wide gold bloom, a small bright core, and a faint cyan sky tint
      const glowZ = -60
      const glowDist = CAM_Z0 - glowZ
      const glowH = halfHeightAt(glowDist) * 2
      const glowBaseY = yAtFraction(glowDist, 0.335)

      const makeSprite = (rgb: string, w: number, h: number, y: number) => {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: makeGlowTexture(rgb),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        )
        sprite.scale.set(w, h, 1)
        sprite.position.set(0, y, glowZ)
        scene.add(sprite)
        return sprite
      }
      const glowGold = makeSprite("255,140,0", glowH * 2.6, glowH * 0.95, glowBaseY)
      const glowCore = makeSprite("255,180,84", glowH * 0.9, glowH * 0.28, glowBaseY)
      const glowCyan = makeSprite("0,243,255", glowH * 2.2, glowH * 0.9, glowBaseY + glowH * 0.45)

      // Ridges (nearest drawn last, void-coloured so it merges with the page).
      // Their materials are collected so they can fade away as the camera climbs.
      const fadeMats: { mat: THREE.Material & { opacity: number }; base: number }[] = []
      RIDGES.forEach((layer) => {
        const distance = CAM_Z0 - layer.z
        const heightScale = layer.amp * 2 * halfHeightAt(distance)
        const { geometry, points } = makeRidge(heightScale, layer.seed)
        const meshMat = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true })
        fadeMats.push({ mat: meshMat, base: 1 })
        const mesh = new THREE.Mesh(geometry, meshMat)
        mesh.position.set(0, yAtFraction(distance, layer.frac), layer.z)

        if (layer.rim) {
          const rimMat = new THREE.LineBasicMaterial({
            color: layer.rim,
            transparent: true,
            opacity: layer.rimOpacity,
          })
          fadeMats.push({ mat: rimMat, base: layer.rimOpacity })
          const rim = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), rimMat)
          rim.position.z = 0.05
          mesh.add(rim)
        }
        scene.add(mesh)
      })

      const render = (time = 0) => {
        mouse.cx += (mouse.x - mouse.cx) * 0.05
        mouse.cy += (mouse.y - mouse.cy) * 0.05

        const p = state.progress
        const y = CAM_Y + p * CAM_RISE
        camera.position.set(mouse.cx * 0.7, y + mouse.cy * 0.35, CAM_Z0 - p * CAM_TRAVEL)
        camera.lookAt(mouse.cx * 0.2, y, -100)

        // The glow rises into place during the entrance, then dims as we climb away
        const rise = (1 - state.dawn) * glowH * 0.22
        const dim = 1 - THREE.MathUtils.smoothstep(p, 0.35, 0.95)
        const leave = 1 - THREE.MathUtils.smoothstep(p, 0.55, 0.95)
        fadeMats.forEach(({ mat, base }) => {
          mat.opacity = base * leave
        })
        glowGold.position.y = glowBaseY - rise
        glowCore.position.y = glowBaseY - rise
        ;(glowGold.material as THREE.SpriteMaterial).opacity = 0.62 * state.dawn * dim
        ;(glowCore.material as THREE.SpriteMaterial).opacity = 0.7 * state.dawn * dim
        ;(glowCyan.material as THREE.SpriteMaterial).opacity = 0.1 * state.dawn * dim

        renderer.render(scene, camera)
      }

      const resize = () => {
        const w = stage.clientWidth
        const h = stage.clientHeight
        if (!w || !h) return
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        if (reduceMotion) render()
      }
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(stage)
      resize()

      const onPointerMove = (e: PointerEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
      }
      if (finePointer && !reduceMotion) window.addEventListener("pointermove", onPointerMove)

      // Only render while the hero is on screen
      let visible = true
      const visibility = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting
        },
        { threshold: 0 },
      )
      visibility.observe(section)

      const tick = (time: number) => {
        if (visible) render(time)
      }
      if (reduceMotion) render()
      else gsap.ticker.add(tick)

      teardownScene = () => {
        gsap.ticker.remove(tick)
        window.removeEventListener("pointermove", onPointerMove)
        resizeObserver.disconnect()
        visibility.disconnect()
        disposeScene(scene)
        renderer.dispose()
      }
    } catch {
      // WebGL unavailable: the copy still renders over the plain void background.
    }

    return () => {
      teardownScene?.()
      ctx.revert()
    }
  }, [])

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-label="Introduction"
      className={cn("relative h-[240vh] motion-reduce:h-svh", className)}
    >
      <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden">
        {/* WebGL backdrop */}
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

        {/* Copy */}
        <div
          ref={copyRef}
          className="absolute inset-0 flex items-center justify-center px-6 pb-[10vh] pt-[120px] text-center"
        >
          <div
            className="max-w-[720px]"
            style={{ fontFamily: FONT.body, color: BRAND.text }}
          >
            <p
              className="hz-fade mb-[14px] flex items-center justify-center gap-[10px] text-[0.82rem] tracking-[0.04em]"
              style={{ fontFamily: FONT.mono, color: BRAND.cyan }}
            >
              {CONTENT.eyebrow}
            </p>

            <h1
              className="hz-name mb-[14px] font-bold"
              style={{
                fontFamily: FONT.display,
                fontSize: "clamp(3rem, 9vw, 6.5rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                backgroundImage: "linear-gradient(135deg, #00f0ff 0%, #ff9d00 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              {CONTENT.name}
            </h1>

            <p
              className="hz-fade mb-[22px] flex items-center justify-center gap-[6px] text-[0.94rem]"
              style={{ color: BRAND.textMuted }}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke={BRAND.gold}
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {CONTENT.location}
            </p>

            <p
              className="hz-fade mx-auto mb-8 max-w-[54ch] text-[1.08rem] leading-[1.6]"
              style={{ color: BRAND.textMuted }}
            >
              {CONTENT.description}
            </p>

            <div className="hz-fade mb-[30px] flex flex-wrap justify-center gap-[14px]">
              <a
                href={CONTENT.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-[9px] border border-transparent px-6 py-[13px] text-[0.9rem] font-medium text-[#170a00] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-14px_rgba(255,140,0,0.55)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
                style={{
                  fontFamily: FONT.mono,
                  backgroundImage: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldLight})`,
                }}
              >
                {CONTENT.primaryCta.label}
              </a>
              <a
                href={CONTENT.secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-[9px] border bg-white/[0.02] px-6 py-[13px] text-[0.9rem] font-medium backdrop-blur-[6px] transition-all duration-200 hover:-translate-y-0.5 hover:!border-[#00f3ff] hover:text-[#00f3ff] hover:shadow-[0_16px_32px_-18px_rgba(0,243,255,0.5)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
                style={{
                  fontFamily: FONT.mono,
                  color: BRAND.text,
                  borderColor: BRAND.borderGlass,
                }}
              >
                {CONTENT.secondaryCta.label}
              </a>
            </div>

            <div className="hz-fade flex justify-center gap-[10px]">
              <SocialLink href={CONTENT.github} label="GitHub profile">
                <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-1.94c-3.17.69-3.83-1.53-3.83-1.53-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.16-3.06-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.11 1.17.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.47 3.11-1.17 3.11-1.17.61 1.57.23 2.73.11 3.02.72.8 1.16 1.82 1.16 3.06 0 4.37-2.66 5.34-5.2 5.62.41.36.77 1.06.77 2.14v3.17c0 .3.2.66.79.55 4.51-1.51 7.77-5.76 7.77-10.78C23.25 5.48 18.27.5 12 .5z" />
              </SocialLink>
              <SocialLink href={CONTENT.linkedin} label="LinkedIn profile">
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
              </SocialLink>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          ref={cueRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[34px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-[6px] text-[0.8rem] motion-reduce:hidden"
          style={{ fontFamily: FONT.mono, color: BRAND.textMuted }}
        >
          <span>Scroll</span>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border bg-white/[0.045] backdrop-blur-[14px] transition-colors duration-200 hover:!border-[#00f3ff] hover:text-[#00f3ff] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
      style={{ color: BRAND.textMuted, borderColor: BRAND.borderGlass }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        {children}
      </svg>
    </a>
  )
}

export default HorizonHeroSection
