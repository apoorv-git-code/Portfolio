/**
 * parallax-scrolling.tsx
 * Place at: src/components/ui/parallax-scrolling.tsx
 *
 * Layered parallax hero (Osmo's parallax, via 21st.dev), adapted for the portfolio:
 *
 *  - the four layers (background, mid, title, foreground) scroll at different
 *    speeds, exactly as in the original
 *  - the title layer carries your name and eyebrow; location, CTAs and socials sit
 *    in a fixed overlay that fades out early (so buttons never ride away in a layer)
 *  - the bottom of the hero is masked to transparent, so the page-wide starfield
 *    shows through and the hero melts into the About section (no black bar)
 *  - GSAP work is scoped to this component (the original killed EVERY ScrollTrigger on
 *    unmount) and Lenis moved to <SmoothScroll /> so it serves the whole page
 *  - publishes a mid "light" value to `heroTheme` so the navbar and cursor stay legible
 *    over the artwork, easing to 0 as the hero scrolls away
 *
 * Requires: gsap, lucide-react (both already installed)
 */
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { FileText } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import DepthText from "@/components/ui/DepthText"
import SlideCommit from "@/components/ui/SlideCommit"
import { scrollToSection } from "@/components/ui/smooth-scroll"
import { heroTheme } from "@/lib/hero-theme"
import { RESUME } from "@/lib/site-links"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

/* -------------------------------------------------------------------------
   Content (verbatim from the original site)
   ------------------------------------------------------------------------- */
const CONTENT = {
  eyebrow: "Backend & Systems Engineer · AI/ML",
  nameFirst: "Apoorv",
  nameLast: "Mishra",
  location: "Chandigarh, India",
  primaryCta: { label: "View projects", href: "#projects" },
  secondaryCta: { label: "Get in touch", href: "#contact" },
  github: "https://github.com/apoorv-git-code",
  linkedin: "https://linkedin.com/in/apoorv-mishra07",
} as const

/** Layer artwork from the 21st.dev component. To avoid depending on its CDN,
 *  download the three images into /public and point these at e.g. "/parallax/bg.webp". */
const LAYER_IMAGES = {
  back: "https://cdn.21st.dev/assets/mirror/a4/a43f4eae3459c461345ee676f12d6e1ddca65e8a5279a5af00d475b17ff83aea.webp",
  mid: "https://cdn.21st.dev/assets/mirror/50/50ca6a0d36d2780bfcb469d6db7eaec0be7e0d2961ba69a63d2a1473b040338d.webp",
  front:
    "https://cdn.21st.dev/assets/mirror/e1/e1c8137b5f971c3b3ec1a0f9e79b9c17018767005f844a10082b890472afecfb.webp",
} as const

/** Same speeds as the original component. */
const LAYERS = [
  { layer: "1", yPercent: 70 },
  { layer: "2", yPercent: 55 },
  { layer: "3", yPercent: 40 },
  { layer: "4", yPercent: 10 },
] as const

/** DepthText config. The extrusion is light blue; the face stays paper-white. */
const DEPTH_PROPS = {
  layers: 34,
  depth: 2.4,
  depthColor: "#8fd8ff",
  gradientDepth: false,
  hoverPush: 0.5,
  float: false,
  tilt: 7.5,
  pointerTracking: true,
  smoothing: 0.14,
  perspective: 900,
  autoOrbit: true,
  orbitSpeed: 0.35,
  fontWeight: 900,
  shadow: true,
  outline: false,
  intro: true,
} as const

/** Navbar / cursor lightness while the artwork is on screen (0 = dark page, 1 = light hero).
 *  A middle value keeps both legible whatever the artwork's tones. */
const HERO_LIGHT = 0.55

const MONO = { fontFamily: '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace' }
const DISPLAY = { fontFamily: '"Space Grotesk", "Inter", sans-serif' }

const GITHUB_PATH =
  "M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-1.94c-3.17.69-3.83-1.53-3.83-1.53-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.16-3.06-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.11 1.17.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.47 3.11-1.17 3.11-1.17.61 1.57.23 2.73.11 3.02.72.8 1.16 1.82 1.16 3.06 0 4.37-2.66 5.34-5.2 5.62.41.36.77 1.06.77 2.14v3.17c0 .3.2.66.79.55 4.51-1.51 7.77-5.76 7.77-10.78C23.25 5.48 18.27.5 12 .5z"
const LINKEDIN_PATH =
  "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"

function SocialIcon({ href, label, path }: { href: string; label: string; path: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/25 bg-white/10 text-[#eef1fa] backdrop-blur-[8px] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff8c00] hover:text-[#ff8c00] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    </a>
  )
}

export function ParallaxHero({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const layersRef = useRef<HTMLDivElement>(null)
  const uiRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)

  // DepthText is a single nowrap line, so on small screens the name is stacked as two lines
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setWide(mq.matches)
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // SlideCommit takes a pixel width: 280 on desktop, narrower on small phones
  const [slideWidth, setSlideWidth] = useState(280)
  useEffect(() => {
    const update = () => setSlideWidth(Math.max(220, Math.min(280, window.innerWidth - 48)))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const layers = layersRef.current
    if (!section || !layers) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    heroTheme.light = HERO_LIGHT

    if (reduceMotion) {
      // Still artwork, no scrub; the shared theme just flips once the hero is gone
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom 40%",
        onToggle: (self) => {
          heroTheme.light = self.isActive ? HERO_LIGHT : 0
        },
      })
      return () => {
        st.kill()
        heroTheme.light = 0
      }
    }

    // Everything below is scoped to this section and reverted on unmount
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0,
        },
      })

      LAYERS.forEach(({ layer, yPercent }, idx) => {
        tl.to(
          layers.querySelectorAll(`[data-parallax-layer="${layer}"]`),
          { yPercent, ease: "none" },
          idx === 0 ? undefined : "<",
        )
      })

      // Timeline length is 0.5 (the layer tweens); the overlay leaves in the first 40%
      tl.to(heroTheme, { light: 0, ease: "none", duration: 0.5 }, 0)
        .to(uiRef.current, { opacity: 0, y: -30, ease: "none", duration: 0.2 }, 0)
        .to(cueRef.current, { opacity: 0, ease: "none", duration: 0.08 }, 0)

      // One quiet entrance for the copy (children only, so it never fights the scrub)
      gsap.from("[data-intro]", {
        opacity: 0,
        y: 28,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.15,
      })
    }, section)

    return () => {
      ctx.revert()
      heroTheme.light = 0
    }
  }, [])

  const fade = "linear-gradient(to bottom, #000 70%, transparent 100%)"

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-label="Introduction"
      className={cn("relative z-[2] h-svh", className)}
    >
      {/* Artwork. Masked to transparent at the bottom so the starfield shows through. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        <div ref={layersRef} data-parallax-layers className="absolute inset-0">
          <img
            src={LAYER_IMAGES.back}
            loading="eager"
            width={800}
            data-parallax-layer="1"
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-0 top-0 h-[117.5%] w-full select-none object-cover"
          />
          <img
            src={LAYER_IMAGES.mid}
            loading="eager"
            width={800}
            data-parallax-layer="2"
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-0 top-0 h-[117.5%] w-full select-none object-cover"
          />

          {/* Title layer: eyebrow + name */}
          <div
            data-parallax-layer="3"
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          >
            <p
              data-intro
              className="mb-4 text-[0.8rem] tracking-[0.04em] text-[#00f3ff] [text-shadow:0_2px_18px_rgba(5,5,10,0.6)] sm:text-[0.9rem]"
              style={MONO}
            >
              {CONTENT.eyebrow}
            </p>
            {/* The name, in React Bits DepthText: extruded layers that tilt against the pointer.
                pointer-events-auto lets its hover push work through the (otherwise inert) title layer. */}
            <h1
              data-intro
              className="pointer-events-auto flex flex-col items-center text-[#eef1fa]"
              style={DISPLAY}
            >
              {wide ? (
                <DepthText
                  text={`${CONTENT.nameFirst} ${CONTENT.nameLast}`}
                  fontSize="clamp(3.4rem, 11vw, 9.5rem)"
                  {...DEPTH_PROPS}
                />
              ) : (
                <>
                  <DepthText text={CONTENT.nameFirst} fontSize="clamp(3.2rem, 19vw, 6.5rem)" {...DEPTH_PROPS} />
                  <DepthText text={CONTENT.nameLast} fontSize="clamp(3.2rem, 19vw, 6.5rem)" {...DEPTH_PROPS} />
                </>
              )}
            </h1>
          </div>

          <img
            src={LAYER_IMAGES.front}
            loading="eager"
            width={800}
            data-parallax-layer="4"
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-0 top-0 h-[117.5%] w-full select-none object-cover"
          />
        </div>
      </div>

      {/* Fixed overlay: stays put, then fades early so it never rides away with a layer */}
      <div ref={uiRef} className="absolute inset-x-0 bottom-0 z-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-52"
          style={{ backgroundImage: "linear-gradient(to top, rgba(5,5,10,0.6), rgba(5,5,10,0))" }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 pb-8 sm:px-10 md:px-14">
          <p
            data-intro
            className="flex items-center gap-[6px] text-[0.9rem] text-[#eef1fa]"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="#ff8c00"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {CONTENT.location}
          </p>

          <div data-intro className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* "View projects" is now a slide-to-confirm (React Bits SlideCommit): drag it, or focus it
                and press End / the arrow keys, and the page glides to Projects. */}
            <SlideCommit
              label={`Slide to ${CONTENT.primaryCta.label.toLowerCase()}`}
              doneLabel="Projects"
              errorLabel="Couldn't open"
              onConfirm={() => new Promise<void>((resolve) => setTimeout(resolve, 400))}
              onDone={() => scrollToSection(CONTENT.primaryCta.href.slice(1))}
              trackColor="rgba(11,11,20,0.7)"
              handleColor="#eef1fa"
              successColor="#ff8c00"
              dangerColor="#e5484d"
              width={slideWidth}
              height={56}
              radius={28}
              speed={50}
              returnBounce={0.38}
              landingDip={0.026}
              holdMs={1500}
              className="[&_.slide-commit__track]:backdrop-blur-[8px] [&_.slide-commit__track]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]"
            />
            <a
              href={RESUME.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm text-[#eef1fa] backdrop-blur-[8px] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff8c00] hover:text-[#ff8c00] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff] sm:text-base"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {RESUME.label}
            </a>
            <a
              href={CONTENT.secondaryCta.href}
              className="text-sm text-[#eef1fa] underline decoration-white/40 underline-offset-[5px] transition-colors hover:text-[#ff8c00] hover:decoration-[#ff8c00] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff] sm:text-base"
            >
              {CONTENT.secondaryCta.label}
            </a>
            <div className="flex gap-[10px]">
              <SocialIcon href={CONTENT.github} label="GitHub profile" path={GITHUB_PATH} />
              <SocialIcon href={CONTENT.linkedin} label="LinkedIn profile" path={LINKEDIN_PATH} />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        ref={cueRef}
        aria-hidden="true"
        className="pointer-events-none absolute right-7 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 text-[0.72rem] tracking-[0.08em] text-[#eef1fa] opacity-70 md:flex motion-reduce:hidden"
        style={MONO}
      >
        <span className="[writing-mode:vertical-rl]">Scroll</span>
        <span className="h-10 w-px bg-current" />
      </div>
    </section>
  )
}

export { ParallaxHero as ParallaxComponent }
export default ParallaxHero
