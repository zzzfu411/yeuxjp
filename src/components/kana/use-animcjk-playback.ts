"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  getAnimCjkPlaybackStartStroke,
  getAnimCjkSpeedLabel,
  getAnimCjkTimelineEvents,
  getNextAnimCjkSpeed,
  type AnimCjkSpeedValue,
} from "@/lib/animcjk"

interface UseAnimCjkPlaybackOptions {
  autoPlay: boolean
  cacheKey: string
  ready: boolean
  totalStrokes: number
}

export function useAnimCjkPlayback({
  autoPlay,
  cacheKey,
  ready,
  totalStrokes,
}: UseAnimCjkPlaybackOptions) {
  const [speed, setSpeed] = useState<AnimCjkSpeedValue>(1)
  const [playToken, setPlayToken] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [activeStroke, setActiveStroke] = useState<number>(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer)
    timersRef.current = []
  }, [])

  const scheduleTimeline = useCallback(
    (startFrom: number) => {
      clearTimers()
      if (!totalStrokes) return

      for (const event of getAnimCjkTimelineEvents({ startFrom, totalStrokes, speed })) {
        const timer = setTimeout(() => setActiveStroke(event.stroke), event.delayMs)
        timersRef.current.push(timer)
      }
    },
    [clearTimers, speed, totalStrokes]
  )

  useEffect(() => {
    if (!ready || !totalStrokes) return
    if (isPaused) return

    const startFrom = getAnimCjkPlaybackStartStroke({ activeStroke, totalStrokes })
    if (startFrom === null) return

    scheduleTimeline(startFrom)
    return () => clearTimers()
    // activeStroke advances from the scheduled timeline; including it would restart the same timeline on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken, speed, isPaused, ready, totalStrokes])

  useEffect(() => {
    if (!ready || !autoPlay) return

    setActiveStroke(0)
    setIsPaused(false)
    setPlayToken((value) => value + 1)
  }, [autoPlay, cacheKey, ready])

  useEffect(() => () => clearTimers(), [clearTimers])

  const handleReplay = useCallback(() => {
    clearTimers()
    setActiveStroke(0)
    setIsPaused(false)
    setPlayToken((value) => value + 1)
  }, [clearTimers])

  const handlePrev = useCallback(() => {
    clearTimers()
    setActiveStroke((value) => Math.max(0, value - 1))
    setIsPaused(true)
  }, [clearTimers])

  const handleNext = useCallback(() => {
    clearTimers()
    setActiveStroke((value) => Math.min(totalStrokes, value + 1))
    setIsPaused(true)
  }, [clearTimers, totalStrokes])

  const handleTogglePause = useCallback(() => {
    if (activeStroke > totalStrokes) {
      handleReplay()
      return
    }

    setIsPaused((paused) => !paused)
    if (isPaused) {
      setPlayToken((value) => value + 1)
    } else {
      clearTimers()
    }
  }, [activeStroke, clearTimers, handleReplay, isPaused, totalStrokes])

  const handleCycleSpeed = useCallback(() => {
    setSpeed((current) => getNextAnimCjkSpeed(current))
  }, [])

  return {
    activeStroke,
    isPaused,
    speed,
    speedLabel: getAnimCjkSpeedLabel(speed),
    handlePrev,
    handleTogglePause,
    handleNext,
    handleReplay,
    handleCycleSpeed,
  }
}
