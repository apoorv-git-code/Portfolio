import { CosmicBackdrop } from "@/components/cosmic-backdrop"
import {
  AboutSection,
  ContactSection,
  ExperienceSection,
  ProjectsSection,
  SiteFooter,
} from "@/components/portfolio-sections"
import SplashCursor from "@/components/SplashCursor"
import { LiquidGlassNavbar } from "@/components/ui/liquid-glass-navbar"
import { ParallaxHero } from "@/components/ui/parallax-scrolling"
import { SmoothScroll } from "@/components/ui/smooth-scroll"

export default function App() {
  return (
    <div className="relative isolate min-h-svh bg-[#05050a] font-[Inter,system-ui,sans-serif] text-[#eef1fa] antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-[9px] focus:bg-[#00f3ff] focus:px-4 focus:py-2.5 focus:text-[0.85rem] focus:text-[#04141a]"
        style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
      >
        Skip to content
      </a>

      <CosmicBackdrop />
      <LiquidGlassNavbar />

      <main id="main">
        <ParallaxHero />
        <AboutSection />
        <ProjectsSection />
        <ExperienceSection />
        <ContactSection />
      </main>

      <SiteFooter />
      <SplashCursor
        rainbow
        size={1}
        force={1}
        swirl={3}
        trail={1}
        clickSplash
        zIndex={40}
      />
      <SmoothScroll />
    </div>
  )
}
