import { animate, motion, useMotionValue, useReducedMotion } from "motion/react"
import { useRef, useState, type PointerEvent, type ReactNode } from "react"

import "./flip-card.css"

type FlipCardProps = {
  front: ReactNode
  back: ReactNode
  ariaLabel: string
  className?: string
}

export function FlipCard({ front, back, ariaLabel, className = "" }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [dragging, setDragging] = useState(false)
  const reduceMotion = useReducedMotion()
  const rotation = useMotionValue(0)
  const animation = useRef<ReturnType<typeof animate> | null>(null)
  const drag = useRef<{ pointerId: number; startX: number; startRotation: number; moved: boolean } | null>(null)

  const settle = (degrees: number) => {
    const target = Math.round(degrees / 180) * 180
    animation.current?.stop()
    if (reduceMotion) {
      rotation.jump(target)
    } else {
      animation.current = animate(rotation, target, { type: "spring", stiffness: 160, damping: 22 })
    }
    setFlipped(Math.abs(Math.round(target / 180)) % 2 === 1)
  }

  const flip = () => {
    const current = Math.round(rotation.get() / 180) * 180
    settle(Math.abs(Math.round(current / 180)) % 2 === 1 ? current - 180 : current + 180)
  }

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    animation.current?.stop()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startRotation: rotation.get(),
      moved: false,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const activeDrag = drag.current
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return

    const deltaX = event.clientX - activeDrag.startX
    if (!activeDrag.moved && Math.abs(deltaX) < 5) return
    activeDrag.moved = true
    setDragging(true)
    const width = event.currentTarget.getBoundingClientRect().width
    rotation.set(activeDrag.startRotation + (deltaX / width) * 180)
  }

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const activeDrag = drag.current
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return
    drag.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (activeDrag.moved) {
      settle(rotation.get())
    } else if (!cancelled) {
      flip()
    }
  }

  return (
    <button
      type="button"
      className={`flip-card${dragging ? " flip-card--dragging" : ""}${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
      aria-pressed={flipped}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => onPointerUp(event)}
      onPointerCancel={(event) => onPointerUp(event, true)}
      onLostPointerCapture={(event) => onPointerUp(event, true)}
      onClick={(event) => {
        if (event.detail === 0) flip()
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      <motion.div
        className="flip-card__rotor"
        style={{ rotateY: rotation }}
      >
        <div className="flip-card__face flip-card__face--front" aria-hidden={flipped}>
          {front}
        </div>
        <div className="flip-card__face flip-card__face--back" aria-hidden={!flipped}>
          {back}
        </div>
      </motion.div>
    </button>
  )
}
