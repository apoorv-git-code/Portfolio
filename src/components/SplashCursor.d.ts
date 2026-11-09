import type { CSSProperties, ReactElement } from "react"

export interface SplashCursorProps {
  colors?: string[]
  rainbow?: boolean
  colorSpeed?: number
  intensity?: number
  size?: number
  force?: number
  swirl?: number
  trail?: number
  momentum?: number
  shading?: number
  glow?: number
  quality?: "low" | "medium" | "high"
  clickSplash?: boolean
  intro?: boolean
  contained?: boolean
  theme?: "dark" | "light"
  zIndex?: number
  className?: string
  style?: CSSProperties
}

declare function SplashCursor(props: SplashCursorProps): ReactElement

export default SplashCursor
