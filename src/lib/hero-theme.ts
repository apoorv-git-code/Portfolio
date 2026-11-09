/**
 * Shared, mutable theme state for the hero → page transition.
 *   1 = light hero fully showing, 0 = the normal dark page.
 * Written by <PrismaHero /> (scroll-scrubbed); read every frame by the navbar
 * shader and the cursor so they stay legible on both. A plain object on
 * purpose: no React re-renders while scrolling.
 */
export const heroTheme = { light: 0 }
