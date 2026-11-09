/**
 * smooth-scroll.tsx
 * Place at: src/components/ui/smooth-scroll.tsx
 *
 * Lenis smooth scrolling for the whole page, wired to GSAP ScrollTrigger (so the
 * parallax hero stays in sync) and to the GSAP ticker (one animation clock).
 *
 * Moved out of the parallax component so it isn't torn down with the hero and so
 * it can handle the navbar's #anchor links, which native smooth-scroll no longer
 * does once Lenis is driving.
 *
 * Skipped entirely with prefers-reduced-motion (native scrolling stays).
 * Requires: npm install lenis   (the maintained name of @studio-freight/lenis, same API)
 */
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { useEffect } from "react"

gsap.registerPlugin(ScrollTrigger)

const NAV_OFFSET = 84 // clears the floating navbar, same as the old scroll-padding-top

let activeLenis: Lenis | null = null

/** Scroll to a section by id (or "top") through Lenis, so buttons that aren't <a href="#…"> links
 *  (like the hero's slide-to-view-projects) get the same eased scroll and navbar offset. */
export function scrollToSection(id: string) {
  const target = id === "top" || id === "" ? 0 : document.getElementById(id)
  if (target === null) return
  if (activeLenis) {
    activeLenis.scrollTo(target, { offset: target === 0 ? 0 : -NAV_OFFSET })
  } else if (target === 0) {
    window.scrollTo({ top: 0, behavior: "smooth" })
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({ duration: 1.1 })
    activeLenis = lenis
    lenis.on("scroll", ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // In-page anchors (navbar, hero buttons, skip link) go through Lenis
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]')
      if (!link) return

      const id = link.getAttribute("href")!.slice(1)
      if (id === "" || id === "top") {
        e.preventDefault()
        lenis.scrollTo(0)
        return
      }
      const target = document.getElementById(id)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { offset: -NAV_OFFSET })
    }
    document.addEventListener("click", onClick)

    return () => {
      document.removeEventListener("click", onClick)
      gsap.ticker.remove(raf)
      lenis.destroy()
      activeLenis = null
    }
  }, [])

  return null
}

export default SmoothScroll
