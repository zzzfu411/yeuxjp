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
  const activeStrokeRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer)
    timersRef.current = []
  }, [])

  const updateActiveStroke = useCallback((next: number | ((current: number) => number)) => {
    if (typeof next === "function") {
      setActiveStroke((current) => {
        const resolved = next(current)
        activeStrokeRef.current = resolved
        return resolved
      })
      return
    }

    activeStrokeRef.current = next
    setActiveStroke(next)
  }, [])

  const scheduleTimeline = useCallback(
    (startFrom: number) => {
      clearTimers()
      if (!totalStrokes) return

      for (const event of getAnimCjkTimelineEvents({ startFrom, totalStrokes, speed })) {
        const timer = setTimeout(() => updateActiveStroke(event.stroke), event.delayMs)
        timersRef.current.push(timer)
      }
    },
    [clearTimers, speed, totalStrokes, updateActiveStroke]
  )

  useEffect(() => {
    if (!ready || !totalStrokes) return
    if (isPaused) return

    const startFrom = getAnimCjkPlaybackStartStroke({ activeStroke: activeStrokeRef.current, totalStrokes })
    if (startFrom === null) return

    scheduleTimeline(startFrom)
    return () => clearTimers()
  }, [clearTimers, isPaused, playToken, ready, scheduleTimeline, totalStrokes])

  useEffect(() => {
    if (!ready) return

    const timer = setTimeout(() => {
      // Always restart from stroke 0 when the glyph changes; a stale
      // activeStrokeRef from the previous character would otherwise make the
      // next playback resume mid-glyph. autoPlay only controls whether the
      // timeline starts immediately.
      updateActiveStroke(0)
      if (!autoPlay) {
        setIsPaused(true)
        return
      }
      setIsPaused(false)
      setPlayToken((value) => value + 1)
    }, 0)

    return () => clearTimeout(timer)
  }, [autoPlay, cacheKey, ready, updateActiveStroke])

  useEffect(() => () => clearTimers(), [clearTimers])

  const handleReplay = useCallback(() => {
    clearTimers()
    updateActiveStroke(0)
    setIsPaused(false)
    setPlayToken((value) => value + 1)
  }, [clearTimers, updateActiveStroke])

  const handlePrev = useCallback(() => {
    clearTimers()
    updateActiveStroke((value) => Math.max(0, value - 1))
    setIsPaused(true)
  }, [clearTimers, updateActiveStroke])

  const handleNext = useCallback(() => {
    clearTimers()
    updateActiveStroke((value) => Math.min(totalStrokes, value + 1))
    setIsPaused(true)
  }, [clearTimers, totalStrokes, updateActiveStroke])

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
