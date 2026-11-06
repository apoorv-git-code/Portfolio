# Apoorv Mishra: Portfolio

React + TypeScript + Tailwind CSS v4 + shadcn/ui-ready, with a Three.js/GSAP hero
and a WebGL liquid-glass navbar.

## Run it

    npm install
    npm run dev

Open the URL it prints (usually http://localhost:5173).

## Other commands

    npm run build       # production build into /dist
    npm run preview     # preview the production build
    npm run typecheck   # optional strict TypeScript check

## Where to edit things

- Hero text, links, location:  src/components/ui/horizon-hero-section.tsx  (CONTENT object)
- Navbar links and colors:     src/components/ui/liquid-glass-navbar.tsx
- About / Projects / Experience / Contact text:  src/components/portfolio-sections.tsx
- Page layout and layering:    src/App.tsx
- Colors and theme tokens:     src/index.css

`original-site/` is your old plain HTML/CSS/JS site, kept as a backup.
