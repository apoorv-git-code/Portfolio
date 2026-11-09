"use client"

/**
 * skiper39.tsx
 * Place at: src/components/ui/skiper39.tsx
 *
 * Skiper 39 "Crowd Canvas", adapted for the portfolio's Contact section:
 *  - sized by its container (a rounded card), not by the viewport
 *  - people are scaled to the card's height, and the crowd size follows its width
 *  - the animation pauses while the card is off-screen
 *  - prefers-reduced-motion gets a still crowd instead of walking
 *  - the demo wrapper (white page + "Croud Canvas" label) is dropped; only CrowdCanvas is exported
 *
 * Requires: npm install gsap   (already in this project)
 *
 * Skiper 39 Canvas_Landing_004 — React + Canvas
 * Inspired by and adapted from https://codepen.io/zadvorsky/pen/xxwbBQV
 * illustration by https://www.openpeeps.com/
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version (credit line is in the Contact section).
 *
 * Author: @gurvinder-singh02 · https://gxuri.me · https://x.com/Gur__vi
 */
import { gsap } from "gsap"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

/** Sprite sheet from the original demo. To avoid depending on a third-party CDN,
 *  download it into /public (e.g. /public/crowd.png) and pass src="/crowd.png". */
export const CROWD_SRC =
  "https://cdn.21st.dev/assets/localized/abdb8990a7bef8c2f5af3e45f0a3c969c4b0603fba8be92e81347de4ea4e1ed7.png"

interface CrowdCanvasProps {
  /** Sprite sheet URL. */
  src?: string
  /** Number of people across the sheet (kept as `rows` to match the original API). */
  rows?: number
  /** Number of people down the sheet. */
  cols?: number
  /** Height of one person as a fraction of the canvas height. */
  peepHeight?: number
  className?: string
}

type Stage = { width: number; height: number }

type Peep = {
  rect: [number, number, number, number]
  width: number
  height: number
  x: number
  y: number
  anchorY: number
  scaleX: number
  walk: gsap.core.Timeline | null
}

const randomRange = (min: number, max: number) => min + Math.random() * (max - min)
const randomIndex = (length: number) => (randomRange(0, length) | 0) % Math.max(1, length)
const removeFromArray = <T,>(array: T[], i: number) => array.splice(i, 1)[0]
const removeItemFromArray = <T,>(array: T[], item: T) => {
  const i = array.indexOf(item)
  if (i >= 0) removeFromArray(array, i)
}

const CrowdCanvas = ({
  src = CROWD_SRC,
  rows = 15,
  cols = 7,
  peepHeight = 0.5,
  className,
}: CrowdCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const stage: Stage = { width: 0, height: 0 }
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let ready = false
    let visible = true

    const allPeeps: Peep[] = []
    const availablePeeps: Peep[] = []
    const crowd: Peep[] = []

    /* ---------- Walk ---------- */
    const resetPeep = (peep: Peep) => {
      const direction = Math.random() > 0.5 ? 1 : -1
      // Spread people through the lower part of the stage (scaled to its height)
      const offsetY = stage.height * (0.06 - 0.4 * gsap.parseEase("power2.in")(Math.random()))
      const startY = stage.height - peep.height + offsetY
      let startX: number
      let endX: number

      if (direction === 1) {
        startX = -peep.width
        endX = stage.width
        peep.scaleX = 1
      } else {
        startX = stage.width + peep.width
        endX = 0
        peep.scaleX = -1
      }

      peep.x = startX
      peep.y = startY
      peep.anchorY = startY
      return { startY, endX }
    }

    const normalWalk = (peep: Peep, { startY, endX }: { startY: number; endX: number }) => {
      const xDuration = 10
      const yDuration = 0.25
      const bounce = Math.max(4, stage.height * 0.035)

      const tl = gsap.timeline()
      tl.timeScale(randomRange(0.5, 1.5))
      tl.to(peep, { duration: xDuration, x: endX, ease: "none" }, 0)
      tl.to(
        peep,
        { duration: yDuration, repeat: xDuration / yDuration, yoyo: true, y: startY - bounce },
        0,
      )
      return tl
    }

    const addPeepToCrowd = () => {
      if (!availablePeeps.length) return null
      const peep = removeFromArray(availablePeeps, randomIndex(availablePeeps.length))
      const walk = normalWalk(peep, resetPeep(peep)).eventCallback("onComplete", () => {
        removePeepFromCrowd(peep)
        addPeepToCrowd()
      })
      if (!visible || reduceMotion) walk.pause()

      peep.walk = walk
      crowd.push(peep)
      crowd.sort((a, b) => a.anchorY - b.anchorY) // lower people draw in front
      return peep
    }

    const removePeepFromCrowd = (peep: Peep) => {
      removeItemFromArray(crowd, peep)
      availablePeeps.push(peep)
    }

    /* ---------- Setup ---------- */
    const img = document.createElement("img")

    const createPeeps = () => {
      const { naturalWidth: width, naturalHeight: height } = img
      const total = rows * cols
      const rectWidth = width / rows
      const rectHeight = height / cols

      for (let i = 0; i < total; i++) {
        allPeeps.push({
          rect: [(i % rows) * rectWidth, ((i / rows) | 0) * rectHeight, rectWidth, rectHeight],
          width: rectWidth,
          height: rectHeight,
          x: 0,
          y: 0,
          anchorY: 0,
          scaleX: 1,
          walk: null,
        })
      }
    }

    const render = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      for (const peep of crowd) {
        ctx.save()
        ctx.translate(peep.x, peep.y)
        ctx.scale(peep.scaleX, 1)
        ctx.drawImage(
          img,
          peep.rect[0],
          peep.rect[1],
          peep.rect[2],
          peep.rect[3],
          0,
          0,
          peep.width,
          peep.height,
        )
        ctx.restore()
      }
    }

    const resize = () => {
      if (!ready) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return

      dpr = Math.min(window.devicePixelRatio || 1, 2)
      stage.width = w
      stage.height = h
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)

      crowd.forEach((peep) => peep.walk?.kill())
      crowd.length = 0
      availablePeeps.length = 0
      availablePeeps.push(...allPeeps)

      // Scale every person to the stage, and size the crowd to its width
      const scale = (h * peepHeight) / allPeeps[0].rect[3]
      allPeeps.forEach((peep) => {
        peep.width = peep.rect[2] * scale
        peep.height = peep.rect[3] * scale
      })
      const count = Math.min(allPeeps.length, Math.max(12, Math.round(w / 24)))
      for (let i = 0; i < count; i++) {
        const peep = addPeepToCrowd()
        peep?.walk?.progress(Math.random())
      }

      if (reduceMotion) render() // still frame
    }

    const init = () => {
      createPeeps()
      ready = true
      resize()
      if (!reduceMotion) gsap.ticker.add(render)
    }

    img.onload = init
    img.src = src

    /* ---------- Resize (container-based, debounced) ---------- */
    let resizeTimer: number | undefined
    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resize, 150)
    })
    resizeObserver.observe(canvas)

    /* ---------- Pause while off-screen ---------- */
    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (reduceMotion || !ready) return
        if (visible) {
          gsap.ticker.add(render)
          crowd.forEach((peep) => peep.walk?.resume())
        } else {
          gsap.ticker.remove(render)
          crowd.forEach((peep) => peep.walk?.pause())
        }
      },
      { threshold: 0 },
    )
    visibility.observe(canvas)

    return () => {
      window.clearTimeout(resizeTimer)
      resizeObserver.disconnect()
      visibility.disconnect()
      img.onload = null
      gsap.ticker.remove(render)
      crowd.forEach((peep) => peep.walk?.kill())
    }
  }, [src, rows, cols, peepHeight])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("absolute inset-0 h-full w-full", className)}
    />
  )
}

export { CrowdCanvas }
export default CrowdCanvas
