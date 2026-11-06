/**
 * liquid-glass-navbar.tsx
 * Place at: src/components/ui/liquid-glass-navbar.tsx
 *
 * Floating glass navbar for Apoorv Mishra's portfolio.
 * Structure is taken from the original index.html header: logo, four section
 * links (About, Projects, Experience, Contact), GitHub + LinkedIn, and a
 * mobile toggle at <= 720px. Behaviour mirrors the original script.js:
 * scrolled state (> 8px), scroll-spy, Escape / outside-click / resize close.
 *
 * The WebGL layer renders a flowing liquid surface (domain-warped noise in
 * void / gold / cyan) plus a metaball "droplet" that slides to the active or
 * hovered link and merges with the pointer. Tones are read from the CSS
 * variables below, so palette edits in CSS reach the shader too.
 *
 * Requires: npm install lucide-react   (no extra WebGL library; raw WebGL)
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { Briefcase, FolderGit2, Mail, User, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------
   Content: from the original header
   ------------------------------------------------------------------------- */
const BRAND_NAME = "Apoorv Mishra"
const GITHUB = "https://github.com/apoorv-git-code"
const LINKEDIN = "https://linkedin.com/in/apoorv-mishra07"

const NAV_ITEMS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "about", label: "About", icon: User },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "contact", label: "Contact", icon: Mail },
]

/* -------------------------------------------------------------------------
   Palette: from :root in the original style.css
   These become CSS variables on the header; the shader reads them back.
   ------------------------------------------------------------------------- */
const THEME_VARS = {
  "--lg-void": "#05050a",
  "--lg-gold": "#ff8c00",
  "--lg-cyan": "#00f3ff",
  "--lg-text": "#eef1fa",
  "--lg-text-muted": "#9aa3ba",
  "--lg-border": "rgba(255,255,255,0.09)",
} as const

const FONT_DISPLAY = '"Space Grotesk", "Inter", sans-serif'
const FONT_MONO = '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace'

/* -------------------------------------------------------------------------
   Shader
   ------------------------------------------------------------------------- */
const VERT = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;       // canvas size in device px
uniform float uDpr;
uniform float uTime;
uniform vec2  uMouse;     // device px, origin bottom-left
uniform float uHover;     // 0..1 pointer inside the bar
uniform vec2  uBlob;      // x = centre (device px), y = width (device px)
uniform float uBlobOn;    // 0..1 droplet visible
uniform float uScrolled;  // 0..1
uniform vec3  uVoid;
uniform vec3  uGold;
uniform vec3  uCyan;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.1, 9.7);
    a *= 0.5;
  }
  return v;
}
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  float u = uDpr;
  vec2 px = gl_FragCoord.xy;
  vec2 hs = uRes * 0.5;

  // Pill silhouette
  float sdPill = sdRoundBox(px - hs, hs, hs.y);
  float m = smoothstep(1.0, -1.0, sdPill);
  if (m <= 0.0) { gl_FragColor = vec4(0.0); return; }

  // Liquid body: domain-warped noise, tinted gold and cyan
  float t = uTime * 0.12;
  vec2 uv = px / uRes.y;
  vec2 q = vec2(fbm(uv * 1.5 + vec2(0.0, t)), fbm(uv * 1.5 + vec2(5.2, 1.3) - t));
  float f = fbm(uv * 1.3 + 2.2 * q + vec2(t * 0.6, -t * 0.4));

  vec3 col = uVoid * 1.4;
  col = mix(col, uGold, smoothstep(0.55, 0.85, f) * 0.22);
  col = mix(col, uCyan, smoothstep(0.45, 0.85, q.x * q.y * 2.0) * 0.12);
  float alpha = mix(0.30, 0.50, uScrolled) + smoothstep(0.55, 0.85, f) * 0.05;

  // Droplet: pill around the active/hovered link, merged with the pointer
  float bh = uRes.y * 0.5 - 11.0 * u;
  vec2 bp = px - vec2(uBlob.x, hs.y);
  float wob = (fbm(uv * 3.5 + vec2(uTime * 0.35, -uTime * 0.2)) - 0.5) * 5.0 * u;
  float dB = sdRoundBox(bp, vec2(uBlob.y * 0.5 + 2.0 * u, bh), bh) + wob * uBlobOn;
  dB = mix(200.0 * u, dB, uBlobOn);
  float dM = length(px - uMouse) - 24.0 * u * uHover + (1.0 - uHover) * 80.0 * u;
  float d = smin(dB, dM, 18.0 * u);

  float inside = smoothstep(1.5 * u, -1.5 * u, d);
  float core = smoothstep(0.0, -16.0 * u, d);
  float rim = smoothstep(3.5 * u, 0.0, abs(d + 1.8 * u));
  float glint = inside * smoothstep(0.55, 1.0, px.y / uRes.y) * 0.10;

  col = mix(col, uGold * (0.20 + 0.25 * core), inside * 0.85);
  col = mix(col, mix(uCyan, uGold, 0.3), rim * 0.7);
  col += uCyan * glint * 0.6;
  alpha = max(alpha, inside * (0.34 + 0.2 * core));
  alpha = max(alpha, rim * 0.6);

  // Glass edge: cyan (top-left) to gold (bottom-right), brighter along the top
  float edge = smoothstep(1.8 * u, 0.0, abs(sdPill + 0.9 * u));
  float ang = clamp(px.x / uRes.x * 0.9 + (1.0 - px.y / uRes.y) * 0.3, 0.0, 1.0);
  float topBias = 0.35 + 0.65 * (px.y / uRes.y);
  col = mix(col, mix(uCyan, uGold, ang), edge * topBias * 0.75);
  alpha = max(alpha, edge * (0.28 + 0.35 * topBias));

  // Slow diagonal sheen
  float sh = pow(max(0.0, sin((px.x / uRes.x * 1.1 - px.y / uRes.y * 0.4 - uTime * 0.04) * 6.2832)), 14.0) * 0.07;
  col += vec3(sh);
  alpha += sh * 0.5;

  alpha = clamp(alpha, 0.0, 1.0);
  gl_FragColor = vec4(col * alpha, alpha) * m; // premultiplied alpha
}
`

function readColor(el: HTMLElement, name: string, fallback: string): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue(name).trim() || fallback
  const hex = /^#?([0-9a-f]{6})$/i.exec(raw)?.[1] ?? fallback.replace("#", "")
  const n = parseInt(hex, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/* -------------------------------------------------------------------------
   Component
   ------------------------------------------------------------------------- */
export function LiquidGlassNavbar({ className }: { className?: string }) {
  const headerRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [glFailed, setGlFailed] = useState(false)

  // Targets written by React/events, read by the render loop
  const target = useRef({ bx: 0, bw: 0, bon: 0, mx: 0, my: 0, hover: 0, scrolled: 0 })
  const kick = useRef<() => void>(() => {})

  /* ---------- Measure the droplet target (active or hovered link) ---------- */
  const measure = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const t = target.current
    const cr = canvas.getBoundingClientRect()
    const el = (hoveredId ?? activeId) ? linkRefs.current[(hoveredId ?? activeId)!] : null
    const r = el?.getBoundingClientRect()
    const isMobile = window.matchMedia("(max-width: 720px)").matches // links live in the dropdown there
    if (!isMobile && r && r.width > 0 && cr.width > 0) {
      t.bx = r.left - cr.left + r.width / 2
      t.bw = r.width
      t.bon = 1
    } else {
      t.bon = 0
    }
    kick.current()
  }, [activeId, hoveredId])

  const measureRef = useRef(measure)
  measureRef.current = measure

  useEffect(() => {
    measure()
    document.fonts?.ready.then(measure)
  }, [measure, open])

  /* ---------- Scrolled state + scroll-spy (as in the original script) ---------- */
  useEffect(() => {
    const onScroll = () => {
      const s = window.scrollY > 8
      setScrolled(s)
      target.current.scrolled = s ? 1 : 0
      kick.current()
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          setActiveId(entry.target.id === "top" ? null : entry.target.id)
        })
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    )
    ;["top", ...NAV_ITEMS.map((n) => n.id)].forEach((id) => {
      const el = document.getElementById(id)
      if (el) spy.observe(el)
    })
    return () => spy.disconnect()
  }, [])

  /* ---------- Mobile menu: Escape, outside click, resize ---------- */
  useEffect(() => {
    const close = (returnFocus: boolean) => {
      setOpen(false)
      if (returnFocus) toggleRef.current?.focus()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true)
    }
    const onClick = (e: MouseEvent) => {
      const node = e.target as Node
      if (!navRef.current?.contains(node) && !toggleRef.current?.contains(node)) close(false)
    }
    const onResize = () => {
      if (window.innerWidth > 720) close(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("click", onClick)
    window.addEventListener("resize", onResize)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("click", onClick)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  /* ---------- WebGL liquid layer ---------- */
  useEffect(() => {
    const canvas = canvasRef.current
    const header = headerRef.current
    if (!canvas || !header) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "low-power",
    })
    if (!gl) {
      setGlFailed(true)
      return
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn("[LiquidGlassNavbar] shader error:", gl.getShaderInfoLog(sh))
        gl.deleteShader(sh)
        return null
      }
      return sh
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) {
      setGlFailed(true)
      return
    }
    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setGlFailed(true)
      return
    }
    gl.useProgram(program)

    // One oversized triangle covers the canvas
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, "aPos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const loc = (name: string) => gl.getUniformLocation(program, name)
    const U = {
      res: loc("uRes"),
      dpr: loc("uDpr"),
      time: loc("uTime"),
      mouse: loc("uMouse"),
      hover: loc("uHover"),
      blob: loc("uBlob"),
      blobOn: loc("uBlobOn"),
      scrolled: loc("uScrolled"),
    }

    // Shader tones come from the CSS variables on the header
    const cVoid = readColor(header, "--lg-void", THEME_VARS["--lg-void"])
    const cGold = readColor(header, "--lg-gold", THEME_VARS["--lg-gold"])
    const cCyan = readColor(header, "--lg-cyan", THEME_VARS["--lg-cyan"])
    gl.uniform3f(loc("uVoid"), ...cVoid)
    gl.uniform3f(loc("uGold"), ...cGold)
    gl.uniform3f(loc("uCyan"), ...cCyan)

    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // Smoothed state
    const s = { bx: 0, bw: 0, bon: 0, mx: 0, my: 0, hover: 0, scrolled: 0 }
    let dpr = 1
    let cssH = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      cssH = h
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
      measureRef.current()
    }

    const step = (dt: number) => {
      const t = target.current
      const k = (rate: number) => (reduceMotion ? 1 : 1 - Math.exp(-dt * rate))
      if (s.bon < 0.02) {
        s.bx = t.bx // appear in place instead of sliding in from the left edge
        s.bw = t.bw
      }
      s.bx += (t.bx - s.bx) * k(9)
      s.bw += (t.bw - s.bw) * k(9)
      s.bon += (t.bon - s.bon) * k(10)
      if (s.hover < 0.02) {
        s.mx = t.mx
        s.my = t.my
      }
      s.mx += (t.mx - s.mx) * k(16)
      s.my += (t.my - s.my) * k(16)
      s.hover += (t.hover - s.hover) * k(8)
      s.scrolled += (t.scrolled - s.scrolled) * k(6)
    }

    const draw = (time: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(U.res, canvas.width, canvas.height)
      gl.uniform1f(U.dpr, dpr)
      gl.uniform1f(U.time, time)
      gl.uniform2f(U.mouse, s.mx * dpr, (cssH - s.my) * dpr)
      gl.uniform1f(U.hover, s.hover)
      gl.uniform2f(U.blob, s.bx * dpr, s.bw * dpr)
      gl.uniform1f(U.blobOn, s.bon)
      gl.uniform1f(U.scrolled, s.scrolled)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      step(dt)
      draw(now / 1000)
      raf = requestAnimationFrame(frame)
    }

    if (reduceMotion) {
      // Static liquid: redraw only when something changes
      kick.current = () => {
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          step(1)
          draw(0)
        })
      }
    } else {
      raf = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    kick.current()

    const onLost = (e: Event) => e.preventDefault()
    canvas.addEventListener("webglcontextlost", onLost)

    return () => {
      cancelAnimationFrame(raf)
      kick.current = () => {}
      ro.disconnect()
      canvas.removeEventListener("webglcontextlost", onLost)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [])

  /* ---------- Pointer tracking for the liquid ---------- */
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return
    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    const t = target.current
    t.mx = e.clientX - r.left
    t.my = e.clientY - r.top
    t.hover = 1
    kick.current()
  }
  const onPointerLeave = () => {
    target.current.hover = 0
    setHoveredId(null)
    kick.current()
  }

  const linkClass = (id: string) =>
    cn(
      "relative inline-flex items-center gap-2 whitespace-nowrap rounded-full px-[14px] py-2 text-[0.88rem] transition-colors duration-150",
      "hover:text-[#00f3ff] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]",
      "max-[720px]:rounded-none max-[720px]:border-t max-[720px]:border-dashed max-[720px]:border-white/[0.09] max-[720px]:px-2 max-[720px]:py-3 max-[720px]:first:border-t-0",
      activeId === id || hoveredId === id ? "text-[#00f3ff]" : "text-[#9aa3ba]",
    )

  return (
    <header
      ref={headerRef}
      style={THEME_VARS as unknown as CSSProperties}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-3",
        className,
      )}
    >
      <div
        className="pointer-events-auto relative h-[60px] w-full max-w-[1120px]"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {/* Glass layer: blur of the page behind + WebGL liquid on top */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 overflow-hidden rounded-full border border-white/[0.09] backdrop-blur-[14px] backdrop-saturate-150 transition-colors duration-300",
            glFailed
              ? scrolled
                ? "bg-[rgba(5,5,10,0.82)]"
                : "bg-[rgba(5,5,10,0.6)]"
              : "bg-[rgba(5,5,10,0.18)]",
          )}
        >
          <canvas
            ref={canvasRef}
            className={cn("absolute inset-0 h-full w-full", glFailed && "hidden")}
          />
        </div>

        {/* Content layer */}
        <div className="relative flex h-full items-center gap-6 px-5 max-[720px]:justify-between max-[720px]:gap-3">
          <a
            href="#top"
            className="flex items-center gap-[10px] whitespace-nowrap text-base font-semibold text-[#eef1fa] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            <span className="relative inline-block h-[17px] w-[17px]" aria-hidden="true">
              <span className="absolute left-1/2 top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff8c00] shadow-[0_0_10px_2px_rgba(255,140,0,0.55)]" />
              <span className="absolute inset-0 animate-[spin_6s_linear_infinite] motion-reduce:animate-none">
                <span className="absolute left-1/2 top-0 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-[#00f3ff] shadow-[0_0_6px_1px_rgba(0,243,255,0.5)]" />
              </span>
            </span>
            {BRAND_NAME}
          </a>

          <nav
            ref={navRef}
            id="main-nav"
            aria-label="Primary"
            style={{ fontFamily: FONT_MONO }}
            className={cn(
              "ml-3 flex flex-1 items-center gap-0.5",
              "max-[720px]:absolute max-[720px]:left-0 max-[720px]:right-0 max-[720px]:top-[calc(100%+10px)] max-[720px]:ml-0 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-0 max-[720px]:rounded-3xl max-[720px]:border max-[720px]:border-white/[0.09] max-[720px]:bg-[rgba(5,5,10,0.92)] max-[720px]:p-2 max-[720px]:backdrop-blur-[14px]",
              !open && "max-[720px]:hidden",
            )}
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                ref={(el) => {
                  linkRefs.current[id] = el
                }}
                aria-current={activeId === id ? "true" : undefined}
                className={linkClass(id)}
                onClick={() => {
                  setActiveId(id)
                  setOpen(false)
                }}
                onPointerEnter={(e) => e.pointerType !== "touch" && setHoveredId(id)}
                onPointerLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(id)}
                onBlur={() => setHoveredId(null)}
              >
                <Icon className="h-[14px] w-[14px] shrink-0" strokeWidth={2} aria-hidden="true" />
                {label}
              </a>
            ))}

            {/* Socials: hidden in the bar on mobile (as original), offered in the menu instead */}
            <div className="hidden gap-[10px] border-t border-dashed border-white/[0.09] px-2 pb-1 pt-3 max-[720px]:flex">
              <SocialLink href={GITHUB} label="GitHub profile" path={GITHUB_PATH} />
              <SocialLink href={LINKEDIN} label="LinkedIn profile" path={LINKEDIN_PATH} />
            </div>
          </nav>

          <div className="flex gap-[10px] max-[720px]:hidden">
            <SocialLink href={GITHUB} label="GitHub profile" path={GITHUB_PATH} />
            <SocialLink href={LINKEDIN} label="LinkedIn profile" path={LINKEDIN_PATH} />
          </div>

          <button
            ref={toggleRef}
            type="button"
            aria-label="Toggle navigation"
            aria-controls="main-nav"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="hidden h-[38px] w-[38px] flex-col justify-center gap-[5px] rounded-[9px] border border-white/[0.09] bg-transparent max-[720px]:flex [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
          >
            <span
              className={cn(
                "mx-auto block h-0.5 w-[18px] bg-[#9aa3ba] transition-transform duration-200",
                open && "translate-y-[7px] rotate-45",
              )}
            />
            <span
              className={cn(
                "mx-auto block h-0.5 w-[18px] bg-[#9aa3ba] transition-opacity duration-200",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "mx-auto block h-0.5 w-[18px] bg-[#9aa3ba] transition-transform duration-200",
                open && "-translate-y-[7px] -rotate-45",
              )}
            />
          </button>
        </div>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------
   Social icon (paths from the original index.html)
   ------------------------------------------------------------------------- */
const GITHUB_PATH =
  "M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-1.94c-3.17.69-3.83-1.53-3.83-1.53-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.16-3.06-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.11 1.17.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.47 3.11-1.17 3.11-1.17.61 1.57.23 2.73.11 3.02.72.8 1.16 1.82 1.16 3.06 0 4.37-2.66 5.34-5.2 5.62.41.36.77 1.06.77 2.14v3.17c0 .3.2.66.79.55 4.51-1.51 7.77-5.76 7.77-10.78C23.25 5.48 18.27.5 12 .5z"
const LINKEDIN_PATH =
  "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"

function SocialLink({ href, label, path }: { href: string; label: string; path: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-white/[0.09] bg-white/[0.045] text-[#9aa3ba] transition-colors duration-200 hover:border-[#00f3ff] hover:text-[#00f3ff] [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
    >
      <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    </a>
  )
}

export default LiquidGlassNavbar
