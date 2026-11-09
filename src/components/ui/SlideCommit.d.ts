import type { ReactElement, ReactNode } from "react"

/** Types for the React Bits SlideCommit (JS + CSS variant) so TypeScript files can import it. */
export interface SlideCommitProps {
  label?: string
  doneLabel?: string
  errorLabel?: string
  /** Return a promise to show the spinner while work runs; throw / reject to show the error state. */
  onConfirm?: () => unknown
  onDone?: () => void
  onError?: (reason: unknown) => void
  trackColor?: string
  handleColor?: string
  successColor?: string
  dangerColor?: string
  width?: number
  height?: number
  radius?: number
  speed?: number
  returnBounce?: number
  landingDip?: number
  holdMs?: number
  disabled?: boolean
  icon?: ReactNode
  className?: string
}

declare function SlideCommit(props: SlideCommitProps): ReactElement
export default SlideCommit
