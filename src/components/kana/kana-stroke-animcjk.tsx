"use client"

import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Gauge } from "lucide-react"
import { ControlBtn, KanaGlyphBoard } from "@/components/kana/kana-glyph-board"
import {
  getAnimCjkLocalActiveStroke,
  getAnimCjkKanaUrl,
  getAnimCjkSpeedLabel,
  getAnimCjkStrokeOffsets,
  getAnimCjkTimelineEvents,
  getAnimCjkTotalStrokes,
  getNextAnimCjkSpeed,
  SMALL_KANA_MAP,
  parseAnimCJK,
  type AnimCjkSpeedValue,
  type ParsedAnimCjkSvg,
} from "@/lib/animcjk"
export { getAnimCjkKanaUrls } from "@/lib/animcjk"

interface KanaStrokeAnimCJKProps {
  char: string
  className?: string
  label?: string
  /** Show 田字格 (cross guide). Defaults to true. */
  showGrid?: boolean
  /** Show start-of-stroke dots + numbers. Defaults to true. */
  showStartDots?: boolean
  /** Auto-play on mount and on char change. Defaults to true. */
  autoPlay?: boolean
}

export function KanaStrokeAnimCJK({
  char,
  className,
  label,
  showGrid = true,
  showStartDots = true,
  autoPlay = true,
}: KanaStrokeAnimCJKProps) {
  const parts = useMemo(() => Array.from(char), [char])
  const cacheKey = useMemo(() => parts.join(""), [parts])

  const [parsed, setParsed] = useState<{ key: string; svgs?: ParsedAnimCjkSvg[]; error?: string } | null>(null)
  const [speed, setSpeed] = useState<AnimCjkSpeedValue>(1)
  const [playToken, setPlayToken] = useState(0) // bump to restart timeline
  const [isPaused, setIsPaused] = useState(false)
  const [activeStroke, setActiveStroke] = useState<number>(0) // 0 = not started, 1..N = current
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Fetch + parse
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const results = await Promise.all(
          parts.map(async (p) => {
            const url = getAnimCjkKanaUrl(p)
            if (!url) throw new Error("Invalid character")

            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const text = await res.text()
            return parseAnimCJK(text)
          })
        )

        if (cancelled) return
        setParsed({ key: cacheKey, svgs: results })
      } catch (err) {
        if (cancelled) return
        setParsed({ key: cacheKey, error: err instanceof Error ? err.message : String(err) })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [cacheKey, parts])

  // Active set of parsed svgs only when key matches (avoid stale display)
  const svgs = parsed?.key === cacheKey ? parsed.svgs : null

  // Total stroke count across all sub-glyphs (for combos like きゃ)
  const totalStrokes = useMemo(
    () => (svgs ? getAnimCjkTotalStrokes(svgs) : 0),
    [svgs]
  )

  /** Per-glyph stroke offsets so we can compute global active stroke -> local. */
  const offsets = useMemo(() => (svgs ? getAnimCjkStrokeOffsets(svgs) : []), [svgs])

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t)
    timersRef.current = []
  }, [])

  // Schedule activeStroke advance based on speed. Single-stroke duration:
  // 0.8s baseline (matches AnimCJK), multiplied by speed factor. After the
  // last stroke fully draws, we push activeStroke to totalStrokes+1 as a
  // "finished" sentinel so the per-stroke highlight color collapses back to
  // the uniform foreground.
  const scheduleTimeline = useCallback(
    (startFrom: number) => {
      clearTimers()
      if (!totalStrokes) return
      for (const event of getAnimCjkTimelineEvents({ startFrom, totalStrokes, speed })) {
        const t = setTimeout(
          () => setActiveStroke(event.stroke),
          event.delayMs
        )
        timersRef.current.push(t)
      }
    },
    [clearTimers, speed, totalStrokes]
  )

  // Drive playback whenever playToken or speed changes (also when svgs first load + autoPlay).
  useEffect(() => {
    if (!svgs || !totalStrokes) return
    if (isPaused) return
    if (activeStroke > totalStrokes) return // already finished

    const startFrom = Math.max(1, activeStroke + 1)
    scheduleTimeline(startFrom)

    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken, speed, isPaused, svgs, totalStrokes])

  // Auto-play on mount / when character changes
  useEffect(() => {
    if (!svgs) return
    if (!autoPlay) return
    setActiveStroke(0)
    setIsPaused(false)
    setPlayToken((n) => n + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, svgs])

  const handleReplay = useCallback(() => {
    clearTimers()
    setActiveStroke(0)
    setIsPaused(false)
    setPlayToken((n) => n + 1)
  }, [clearTimers])

  const handlePrev = useCallback(() => {
    clearTimers()
    setActiveStroke((n) => Math.max(0, n - 1))
    setIsPaused(true)
  }, [clearTimers])

  const handleNext = useCallback(() => {
    clearTimers()
    setActiveStroke((n) => Math.min(totalStrokes, n + 1))
    setIsPaused(true)
  }, [clearTimers, totalStrokes])

  const handleTogglePause = useCallback(() => {
    if (activeStroke > totalStrokes) {
      handleReplay()
      return
    }
    setIsPaused((p) => !p)
    if (isPaused) {
      // resuming
      setPlayToken((n) => n + 1)
    } else {
      clearTimers()
    }
  }, [activeStroke, totalStrokes, isPaused, handleReplay, clearTimers])

  const handleCycleSpeed = useCallback(() => {
    setSpeed((cur) => getNextAnimCjkSpeed(cur))
  }, [])

  // Cleanup timers on unmount
  useEffect(() => () => clearTimers(), [clearTimers])

  // ---- Render ----
  if (parsed?.key === cacheKey && parsed.error) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-muted-foreground", className)}>
        笔顺 SVG 加载失败：{parsed.error}
      </div>
    )
  }

  if (!svgs) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="w-full max-w-[16rem] aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/20 animate-pulse" />
      </div>
    )
  }

  const speedLabel = getAnimCjkSpeedLabel(speed)

  return (
    <div className={cn("kana-animcjk-wrapper w-full h-full flex flex-col items-stretch gap-3 text-foreground", className)}>
      {/* Animation surface */}
      <div className="relative flex-1 min-h-0 flex items-stretch gap-1.5">
        {svgs.map((svg, i) => {
          const original = parts[i]
          const isSmall = original in SMALL_KANA_MAP
          const offset = offsets[i] ?? 0
          // Map the global active stroke to a local one inside this glyph,
          // clamped to [0, glyph.strokeCount + 1] so the *finished* state
          // (strokeCount + 1) is reachable per glyph — otherwise multi-glyph
          // combos like きゃ would freeze the first glyph at "last stroke is
          // current/highlighted" instead of transitioning to the uniform
          // finished color.
          const localActive = getAnimCjkLocalActiveStroke({
            activeStroke,
            strokeCount: svg.strokeCount,
            offset,
          })
          return (
            <Fragment key={`${cacheKey}-${i}`}>
              <KanaGlyphBoard
                svg={svg}
                activeStroke={localActive}
                showGrid={showGrid}
                showStartDots={showStartDots}
                isSmall={isSmall}
                speed={speed}
                isPaused={isPaused}
                label={i === 0 ? label ?? `Stroke order for ${char}` : undefined}
                /* Yoon: the small kana (ゃ/ゅ/ょ) renders on a narrower
                   board so its proportion against the base kana is visually
                   correct. */
                flexBasis={isSmall ? "minor" : "major"}
              />
            </Fragment>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-[11px] font-mono text-muted-foreground tabular-nums select-none">
          {Math.min(activeStroke, totalStrokes)} / {totalStrokes}
        </div>
        <div className="flex items-center gap-1">
          <ControlBtn onClick={handlePrev} disabled={activeStroke === 0} aria-label="上一笔">
            <SkipBack className="w-3.5 h-3.5" />
          </ControlBtn>
          <ControlBtn
            onClick={handleTogglePause}
            aria-label={isPaused || activeStroke > totalStrokes ? "播放" : "暂停"}
          >
            {activeStroke > totalStrokes ? (
              <RotateCcw className="w-3.5 h-3.5" />
            ) : isPaused ? (
              <Play className="w-3.5 h-3.5" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
          </ControlBtn>
          <ControlBtn onClick={handleNext} disabled={activeStroke >= totalStrokes} aria-label="下一笔">
            <SkipForward className="w-3.5 h-3.5" />
          </ControlBtn>
          <ControlBtn onClick={handleReplay} aria-label="重播">
            <RotateCcw className="w-3.5 h-3.5" />
          </ControlBtn>
          <ControlBtn onClick={handleCycleSpeed} aria-label={`速度：${speedLabel}`}>
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono ml-0.5">{speedLabel}</span>
          </ControlBtn>
        </div>
      </div>
    </div>
  )
}
