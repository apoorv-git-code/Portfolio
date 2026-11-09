/**
 * prisma-hero.tsx
 * Place at: src/components/ui/prisma-hero.tsx
 *
 * Prisma hero layout (video in a rounded frame, giant word-pull-up name,
 * paragraph + pill CTA bottom-right), rewritten for Apoorv Mishra's portfolio:
 *
 *  - LIGHT at the top: a full-bleed video (no borders), lightly lifted with paper
 *    (#eef1fa) so it stays clearly visible, ink-coloured type. Less text: the
 *    "Driven by curiosity…" paragraph now lives in the About section.
 *  - As you scroll the video DARKENS in place: light → brand muted blue-grey
 *    (#9aa3ba) → void (#05050a), then it dissolves to reveal the page-wide
 *    starfield (<CosmicBackdrop />). The type turns light on the way.
 *  - It publishes its light/dark state to `heroTheme`, which the navbar and
 *    cursor read so they stay legible on both.
 *
 * Copy is verbatim from the original site. Requires: framer-motion, gsap, lucide-react.
 */
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { motion, useInView } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useEffect, useRef, type CSSProperties } from "react"

import { heroTheme } from "@/lib/hero-theme"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

/* -------------------------------------------------------------------------
   Content (verbatim from the original site)
   ------------------------------------------------------------------------- */
const CONTENT = {
  eyebrow: "Backend & Systems Engineer · AI/ML",
  location: "Chandigarh, India",
  primaryCta: { label: "View projects", href: "#projects" },
  secondaryCta: { label: "Get in touch", href: "#contact" },
  github: "https://github.com/apoorv-git-code",
  linkedin: "https://linkedin.com/in/apoorv-mishra07",
} as const

/** Background video from the Prisma demo. Swap for your own file in /public if you like. */
const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"

/** How much light paper is washed over the video (0 = raw video, 1 = no video).
 *  Kept low so the video stays clearly visible; raise it if the type needs more contrast. */
const VEIL = 0.14

const INK = "rgb(11,11,20)"
const MONO = { fontFamily: '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace' }
const DISPLAY = { fontFamily: '"Space Grotesk", "Inter", sans-serif' }

const GITHUB_PATH =
  "M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-1.94c-3.17.69-3.83-1.53-3.83-1.53-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.16-3.06-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.11 1.17.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.47 3.11-1.17 3.11-1.17.61 1.57.23 2.73.11 3.02.72.8 1.16 1.82 1.16 3.06 0 4.37-2.66 5.34-5.2 5.62.41.36.77 1.06.77 2.14v3.17c0 .3.2.66.79.55 4.51-1.51 7.77-5.76 7.77-10.78C23.25 5.48 18.27.5 12 .5z"
const LINKEDIN_PATH =
  "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string
  className?: string
  showAsterisk?: boolean
  style?: CSSProperties
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const words = text.split(" ")

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative inline-block"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute -right-[0.3em] top-[0.65em] text-[0.31em]">*</span>
            )}
          </motion.span>
        )
      })}
    </div>
  )
}

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string
  className?: string
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[]
  className?: string
  align?: "start" | "center"
  style?: CSSProperties
}

export const WordsPullUpMultiStyle = ({
  segments,
  className = "",
  align = "center",
  style,
}: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const words: { word: string; className?: string }[] = []
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className })
    })
  })

  return (
    <div
      ref={ref}
      className={cn("inline-flex flex-wrap", align === "center" ? "justify-center" : "justify-start", className)}
      style={style}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  )
}

/* ---------------- Hero ---------------- */
const ease = [0.16, 1, 0.3, 1] as const

function SocialIcon({ href, label, path }: { href: string; label: string; path: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-current/25 bg-white/30 backdrop-blur-[6px] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff8c00] hover:text-[#ff8c00] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    </a>
  )
}

const PrismaHero = ({ className }: { className?: string }) => {
  const sectionRef = useRef<HTMLElement>(null)
  const toneRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const duskRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    heroTheme.light = 1

    if (reduceMotion) {
      // No scroll-linked animation: a still light hero, and the shared theme
      // simply flips to dark once the hero has left the screen.
      video?.pause()
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom 60%",
        onToggle: (self) => {
          heroTheme.light = self.isActive ? 1 : 0
        },
      })
      return () => {
        st.kill()
        heroTheme.light = 0
      }
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          // Don't decode video frames nobody can see
          onUpdate: (self) => {
            if (!video) return
            if (self.progress > 0.55) {
              if (!video.paused) video.pause()
            } else if (video.paused) {
              video.play().catch(() => {})
            }
          },
        },
      })

      tl.to(heroTheme, { light: 0, duration: 0.5 }, 0)
        // the video darkens in place: light → muted blue-grey dusk → void
        .to(duskRef.current, { opacity: 0.5, duration: 0.25 }, 0)
        .to(duskRef.current, { backgroundColor: "rgb(5,5,10)", opacity: 1, duration: 0.25 }, 0.25)
        // once it is void, the frame and the page tone dissolve to reveal the stars
        .to(toneRef.current, { backgroundColor: "rgb(5,5,10)", duration: 0.3 }, 0.2)
        .to(frameRef.current, { opacity: 0, duration: 0.12 }, 0.5)
        .to(toneRef.current, { opacity: 0, duration: 0.3 }, 0.6)
        // type goes from ink to light, then leaves
        .to(contentRef.current, { color: "rgb(238,241,250)", duration: 0.4 }, 0.1)
        .to(contentRef.current, { opacity: 0, y: -70, duration: 0.3 }, 0.6)
        .to(cueRef.current, { opacity: 0, duration: 0.08 }, 0)
        .to({}, { duration: 0.1 }, 0.9) // short hold at the end
    }, section)

    // Pause the video whenever the hero is off-screen
    const io = new IntersectionObserver(([entry]) => {
      if (!video) return
      if (!entry.isIntersecting) video.pause()
    })
    io.observe(section)

    return () => {
      io.disconnect()
      ctx.revert()
      heroTheme.light = 0
    }
  }, [])

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-label="Introduction"
      className={cn("relative h-[260vh] motion-reduce:h-svh", className)}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* Page tone: paper → muted → void → transparent (reveals the starfield) */}
        <div ref={toneRef} aria-hidden="true" className="absolute inset-0 bg-[#eef1fa]" />

        {/* Video frame */}
        <div
          ref={frameRef}
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden"
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            src={VIDEO_SRC}
          />
          {/* Light veil: a gentle lift, not a wash-out */}
          <div className="pointer-events-none absolute inset-0 bg-[#eef1fa]" style={{ opacity: VEIL }} />
          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-multiply" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(238,241,250,0.16), rgba(238,241,250,0) 35%, rgba(238,241,250,0.6))",
            }}
          />
          {/* Dusk: fades in over the video on scroll (muted blue-grey, then void) */}
          <div
            ref={duskRef}
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: "rgb(154,163,186)", opacity: 0 }}
          />
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="absolute inset-0 flex items-end"
          style={{ color: INK, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          <div className="grid w-full grid-cols-12 items-end gap-4 px-6 pb-6 sm:px-10 md:px-14 md:pb-8">
            <div className="col-span-12 lg:col-span-8">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 0.75 }}
                transition={{ duration: 0.8, delay: 0.2, ease }}
                className="mb-3 text-[0.8rem] tracking-[0.04em] sm:text-[0.86rem]"
                style={MONO}
              >
                {CONTENT.eyebrow}
              </motion.p>

              <h1
                className="font-semibold leading-[0.85] tracking-[-0.07em] text-[24vw] sm:text-[20vw] md:text-[16vw] lg:text-[11vw] xl:text-[11.5vw]"
                style={DISPLAY}
              >
                <WordsPullUpMultiStyle
                  align="start"
                  segments={[
                    { text: "Apoorv" },
                    {
                      text: "Mishra",
                      className:
                        "bg-[linear-gradient(135deg,#ff8c00_0%,#0aa3b5_100%)] bg-clip-text text-transparent",
                    },
                  ]}
                />
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-6 lg:col-span-4 lg:pb-10">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease }}
                className="flex items-center gap-[6px] text-[0.9rem]"
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
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease }}
                className="flex flex-wrap items-center gap-x-5 gap-y-3"
              >
                <a
                  href={CONTENT.primaryCta.href}
                  className="group inline-flex items-center gap-2 self-start rounded-full bg-[#0b0b14] py-1 pl-5 pr-1 text-sm font-medium text-[#eef1fa] transition-all hover:gap-3 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff] sm:text-base"
                >
                  {CONTENT.primaryCta.label}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff8c00] transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowRight className="h-4 w-4" style={{ color: "#170a00" }} />
                  </span>
                </a>

                <a
                  href={CONTENT.secondaryCta.href}
                  className="text-sm underline decoration-current/40 underline-offset-[5px] transition-colors hover:text-[#ff8c00] hover:decoration-[#ff8c00] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff] sm:text-base"
                >
                  {CONTENT.secondaryCta.label}
                </a>

                <div className="flex gap-[10px]">
                  <SocialIcon href={CONTENT.github} label="GitHub profile" path={GITHUB_PATH} />
                  <SocialIcon href={CONTENT.linkedin} label="LinkedIn profile" path={LINKEDIN_PATH} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          ref={cueRef}
          aria-hidden="true"
          className="pointer-events-none absolute right-7 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 text-[0.72rem] tracking-[0.08em] opacity-60 md:flex motion-reduce:hidden"
          style={{ ...MONO, color: INK }}
        >
          <span className="[writing-mode:vertical-rl]">Scroll</span>
          <span className="h-10 w-px bg-current" />
        </div>
      </div>
    </section>
  )
}

export { PrismaHero }
export default PrismaHero
