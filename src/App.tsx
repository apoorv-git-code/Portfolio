import { CosmicBackdrop } from "@/components/cosmic-backdrop"
import {
  AboutSection,
  ContactSection,
  ExperienceSection,
  ProjectsSection,
  SiteFooter,
} from "@/components/portfolio-sections"
import { CometCursor } from "@/components/ui/comet-cursor"
import { HorizonHeroSection } from "@/components/ui/horizon-hero-section"
import { LiquidGlassNavbar } from "@/components/ui/liquid-glass-navbar"

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
        <HorizonHeroSection />
        <AboutSection />
        <ProjectsSection />
        <ExperienceSection />
        <ContactSection />
      </main>

      <SiteFooter />
      <CometCursor />
    </div>
  )
}
