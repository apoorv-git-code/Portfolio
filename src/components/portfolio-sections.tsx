/**
 * portfolio-sections.tsx
 * Place at: src/components/portfolio-sections.tsx
 *
 * The content below the hero, ported from the original index.html / style.css:
 * About ("LOG_01 Profile"), Projects ("LOG_02 Missions"),
 * Experience ("LOG_03 Deployment"), Contact ("LOG_04 Transmit") and the footer.
 * All copy is verbatim. Section ids match the navbar's scroll-spy.
 */
import { useEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------
   Content (verbatim from the original)
   ------------------------------------------------------------------------- */
const GITHUB = "https://github.com/apoorv-git-code"
const GITHUB_TASKS = "https://github.com/apoorv-git-code/codealpha_tasks"
const LINKEDIN = "https://linkedin.com/in/apoorv-mishra07"
const EMAIL = "apoorvmishra2007@gmail.com"

const ABOUT = {
  lede: "Computer Science & Engineering graduate specializing in AI/ML and backend & systems engineering — comfortable moving between model logic and the concurrent, distributed infrastructure that has to run it correctly.",
  skills: [
    "Python",
    "C",
    "Multi-threading",
    "Concurrency Control",
    "Distributed Systems",
    "MongoDB",
    "Streamlit",
    "Git",
  ],
}

const PROJECTS = [
  {
    index: "01",
    title: "Distributed Hotel Management System",
    body: "A multi-threaded hotel management platform built to handle concurrent bookings without double-allocating rooms. Thread-safe reservation logic keeps availability consistent under simultaneous access, with a Streamlit front end and MongoDB as the backing store.",
    stack: ["Python", "Streamlit", "MongoDB", "Concurrency Control"],
    href: GITHUB,
  },
  {
    index: "02",
    title: "Real-Time Concurrent Air Hockey Game Engine",
    body: "A real-time, two-player game engine written in C, using multi-threading to keep physics, input, and rendering loops running concurrently with low latency. Built around a modular design that separates simulation from I/O.",
    stack: ["C", "Multi-threading", "Software Design", "Low-Level Optimization"],
    href: GITHUB,
  },
  {
    index: "03",
    title: "Real-Time Object Detection & Tracking",
    body: "A high-performance computer vision pipeline processing real-time video streams for multi-object identification and persistent spatial tracking. Designed with optimized frame pipelines to minimize detection latency.",
    stack: ["Python", "OpenCV", "Computer Vision", "Deep Learning", "Real-Time Processing"],
    href: GITHUB_TASKS,
  },
  {
    index: "04",
    title: "Neural Language Translation Tool",
    body: "An automated translation engine that processes multi-lingual text inputs through transformer-based sequence models and external API endpoints. Features structured error handling and asynchronous batch processing for rapid translation throughput.",
    stack: ["Python", "NLP", "API Integration", "Asynchronous Processing"],
    href: GITHUB_TASKS,
  },
]

const EXPERIENCE = {
  role: "Software Engineering Intern",
  company: "CodeAlpha",
  points: [
    "Built Python automation scripts to reduce repetitive manual workflows.",
    "Used Git for version control across feature branches and code reviews.",
  ],
}

const GITHUB_PATH =
  "M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-1.94c-3.17.69-3.83-1.53-3.83-1.53-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.16-3.06-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.11 1.17.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.47 3.11-1.17 3.11-1.17.61 1.57.23 2.73.11 3.02.72.8 1.16 1.82 1.16 3.06 0 4.37-2.66 5.34-5.2 5.62.41.36.77 1.06.77 2.14v3.17c0 .3.2.66.79.55 4.51-1.51 7.77-5.76 7.77-10.78C23.25 5.48 18.27.5 12 .5z"
const LINKEDIN_PATH =
  "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"

const MONO = { fontFamily: '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace' }
const DISPLAY = { fontFamily: '"Space Grotesk", "Inter", sans-serif' }

/* -------------------------------------------------------------------------
   Shared building blocks
   ------------------------------------------------------------------------- */

/** Scroll reveal (same trigger as the original: 12% visible, 40px bottom margin). */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || !("IntersectionObserver" in window)) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-[26px] opacity-0",
        className,
      )}
    >
      {children}
    </div>
  )
}

function Section({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={cn("relative z-[1] py-[60px]", className)}>
      <div className="mx-auto max-w-[1120px] px-6 max-[480px]:px-[18px]">{children}</div>
    </section>
  )
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-white/[0.09] bg-white/[0.045] px-11 pb-12 pt-11 backdrop-blur-[18px] max-[720px]:px-7 max-[720px]:pb-9 max-[720px]:pt-[34px]",
        className,
      )}
    >
      {children}
    </div>
  )
}

function Eyebrow({ tag, children }: { tag: string; children: ReactNode }) {
  return (
    <p
      className="mb-[14px] flex items-center gap-[10px] text-[0.82rem] tracking-[0.04em] text-[#00f3ff]"
      style={MONO}
    >
      <span
        className="rounded-full border border-[rgba(255,140,0,0.35)] bg-[rgba(255,140,0,0.16)] px-2 py-[3px] text-[0.72rem] tracking-[0.06em] text-[#ff8c00]"
        style={MONO}
      >
        {tag}
      </span>
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="mb-[18px] font-semibold tracking-[-0.01em]"
      style={{ ...DISPLAY, fontSize: "clamp(1.7rem, 3vw, 2.3rem)" }}
    >
      {children}
    </h2>
  )
}

function IconLink({ href, label, path }: { href: string; label: string; path: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-white/[0.09] bg-white/[0.02] text-[#9aa3ba] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00f3ff] hover:text-[#00f3ff] hover:shadow-[0_10px_22px_-14px_rgba(0,243,255,0.5)] [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    </a>
  )
}

/* -------------------------------------------------------------------------
   Sections
   ------------------------------------------------------------------------- */
export function AboutSection() {
  return (
    <Section id="about" className="pt-[90px]">
      <Reveal>
        <Panel>
          <Eyebrow tag="LOG_01">Profile</Eyebrow>
          <SectionTitle>Core focus</SectionTitle>
          <p className="max-w-[62ch] text-[1.05rem] text-[#9aa3ba]">{ABOUT.lede}</p>

          <div className="mt-[30px] flex flex-wrap gap-[10px]">
            {ABOUT.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-[0.85rem] text-[#eef1fa] transition-all duration-200 hover:-translate-y-0.5 odd:hover:border-[#00f3ff] odd:hover:text-[#00f3ff] odd:hover:shadow-[0_0_18px_-6px_rgba(0,243,255,0.5)] even:hover:border-[#ff8c00] even:hover:text-[#ff8c00] even:hover:shadow-[0_0_18px_-6px_rgba(255,140,0,0.55)]"
                style={MONO}
              >
                {skill}
              </span>
            ))}
          </div>
        </Panel>
      </Reveal>
    </Section>
  )
}

export function ProjectsSection() {
  return (
    <Section id="projects">
      <Reveal>
        <Eyebrow tag="LOG_02">Missions</Eyebrow>
      </Reveal>
      <Reveal>
        <SectionTitle>Selected work</SectionTitle>
      </Reveal>

      <div className="mt-2 grid grid-cols-2 gap-[22px] max-[720px]:grid-cols-1">
        {PROJECTS.map((p) => (
          <Reveal key={p.index} className="h-full">
            <article className="group relative h-full overflow-hidden rounded-[18px] border border-white/[0.09] bg-white/[0.045] px-7 pb-7 pt-[30px] backdrop-blur-[18px] transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1.5 hover:border-white/[0.18] hover:bg-white/[0.07] max-[720px]:hover:translate-y-0">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-[40%] opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100 max-[720px]:group-hover:opacity-0"
                style={{
                  background:
                    "radial-gradient(circle at 30% 20%, rgba(0,243,255,0.16), transparent 55%)",
                }}
              />
              <span className="relative mb-[14px] block text-[0.8rem] text-[#ff8c00]" style={MONO}>
                {p.index}
              </span>
              <h3
                className="relative mb-3 text-[1.25rem] font-semibold tracking-[-0.01em]"
                style={DISPLAY}
              >
                {p.title}
              </h3>
              <p className="relative mb-5 text-[0.96rem] text-[#9aa3ba]">{p.body}</p>

              <div className="relative mb-[22px] flex flex-wrap gap-2">
                {p.stack.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/[0.09] bg-white/[0.04] px-[11px] py-[5px] text-[0.76rem] text-[#9aa3ba] max-[480px]:whitespace-normal min-[481px]:whitespace-nowrap"
                    style={MONO}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex items-center gap-1.5 text-[0.85rem] text-[#00f3ff] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
                style={MONO}
              >
                <span>View on GitHub</span>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </a>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

export function ExperienceSection() {
  return (
    <Section id="experience">
      <Reveal>
        <Panel>
          <Eyebrow tag="LOG_03">Deployment</Eyebrow>
          <SectionTitle>Experience</SectionTitle>

          <div className="mt-[26px] grid max-w-[68ch] grid-cols-[22px_1fr] gap-5">
            <div className="flex justify-center">
              <span
                aria-hidden="true"
                className="mt-1.5 h-[11px] w-[11px] rounded-full bg-[#ff8c00] shadow-[0_0_0_5px_rgba(255,140,0,0.16),0_0_14px_2px_rgba(255,140,0,0.55)]"
              />
            </div>
            <div>
              <p className="text-[1.2rem] font-semibold" style={DISPLAY}>
                {EXPERIENCE.role}
              </p>
              <p className="mb-[14px] text-[0.9rem] text-[#00f3ff]" style={MONO}>
                {EXPERIENCE.company}
              </p>
              <ul>
                {EXPERIENCE.points.map((point) => (
                  <li
                    key={point}
                    className="relative mb-2 pl-[18px] text-[#9aa3ba] before:absolute before:left-0 before:text-[0.85em] before:text-[#ff8c00] before:content-['▹']"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </Reveal>
    </Section>
  )
}

export function ContactSection() {
  return (
    <Section id="contact" className="pb-[100px]">
      <Reveal>
        <Panel>
          <Eyebrow tag="LOG_04">Transmit</Eyebrow>
          <SectionTitle>Let&rsquo;s build something reliable</SectionTitle>
          <p className="max-w-[62ch] text-[1.05rem] text-[#9aa3ba]">
            Open to backend, distributed systems, and AI/ML engineering roles. The fastest way to
            reach me is email.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-5">
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[9px] border border-transparent px-[26px] py-[15px] text-[0.95rem] font-medium text-[#170a00] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-14px_rgba(255,140,0,0.55)] max-[480px]:break-all focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00f3ff]"
              style={{
                ...MONO,
                backgroundImage: "linear-gradient(135deg, #ff8c00, #ffb454)",
              }}
            >
              {EMAIL}
            </a>
            <div className="flex gap-[10px]">
              <IconLink href={GITHUB} label="GitHub profile" path={GITHUB_PATH} />
              <IconLink href={LINKEDIN} label="LinkedIn profile" path={LINKEDIN_PATH} />
            </div>
          </div>
        </Panel>
      </Reveal>
    </Section>
  )
}

export function SiteFooter() {
  return (
    <footer
      className="relative z-[1] px-6 pb-10 pt-[26px] text-center text-[0.8rem] text-[#5e6478]"
      style={MONO}
    >
      <p>Built by Apoorv Mishra · {new Date().getFullYear()}</p>
    </footer>
  )
}
