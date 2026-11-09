import type { CSSProperties, ReactElement } from "react"

/** Types for the React Bits DepthText (JS + CSS variant) so TypeScript files can import it. */
export interface DepthTextProps {
  text?: string
  layers?: number
  depth?: number
  /** Defaults to "currentColor" (inherits the parent's text colour). */
  faceColor?: string
  depthColor?: string
  gradientDepth?: boolean
  tilt?: number
  pointerTracking?: boolean
  smoothing?: number
  perspective?: number
  autoOrbit?: boolean
  orbitSpeed?: number
  hoverPush?: number
  float?: boolean
  fontSize?: string
  fontWeight?: number | string
  shadow?: boolean
  outline?: boolean
  intro?: boolean
  className?: string
  style?: CSSProperties
}

declare function DepthText(props: DepthTextProps): ReactElement
export default DepthText
