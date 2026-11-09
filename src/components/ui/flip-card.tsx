import { motion, useReducedMotion } from "motion/react"
import { useState, type ReactNode } from "react"

import "./flip-card.css"

type FlipCardProps = {
  front: ReactNode
  back: ReactNode
  ariaLabel: string
  className?: string
}

export function FlipCard({ front, back, ariaLabel, className = "" }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)
  const reduceMotion = useReducedMotion()

  return (
    <button
      type="button"
      className={`flip-card ${className}`.trim()}
      aria-label={ariaLabel}
      aria-pressed={flipped}
      onClick={() => setFlipped((current) => !current)}
    >
      <motion.div
        className="flip-card__rotor"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 160, damping: 22 }
        }
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
