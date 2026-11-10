import type { CSSProperties, ReactNode } from "react"

export type ScrollStackItemProps = {
  children: ReactNode
  itemClassName?: string
  style?: CSSProperties
}

export function ScrollStackItem(props: ScrollStackItemProps): ReactNode

export type ScrollStackProps = {
  children: ReactNode
  className?: string
  itemDistance?: number
  itemStackDistance?: number
  stackPosition?: number | string
  itemScale?: number
  baseScale?: number
  dimAmount?: number
  blurAmount?: number
  tiltAmount?: number
  rotationAmount?: number
  holdDistance?: number
  smoothScroll?: boolean
  snap?: boolean
  useWindowScroll?: boolean
  onStackComplete?: () => void
}

export default function ScrollStack(props: ScrollStackProps): ReactNode
