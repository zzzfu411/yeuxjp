"use client"

import { Fragment, useMemo } from "react"
import { cn } from "@/lib/utils"
import { KanaGlyphBoard } from "@/components/kana/kana-glyph-board"
import { KanaStrokeControls } from "@/components/kana/kana-stroke-controls"
import { useAnimCjkPlayback } from "@/components/kana/use-animcjk-playback"
import { useAnimCjkSvgs } from "@/components/kana/use-animcjk-svgs"
import {
  getAnimCjkLocalActiveStroke,
  getAnimCjkStrokeOffsets,
  getAnimCjkTotalStrokes,
  SMALL_KANA_MAP,
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
  const { parts, cacheKey, svgs, error } = useAnimCjkSvgs(char)

  // Total stroke count across all sub-glyphs (for combos like きゃ)
  const totalStrokes = useMemo(
    () => (svgs ? getAnimCjkTotalStrokes(svgs) : 0),
    [svgs]
  )
  const {
    activeStroke,
    isPaused,
    speed,
    speedLabel,
    handlePrev,
    handleTogglePause,
    handleNext,
    handleReplay,
    handleCycleSpeed,
  } = useAnimCjkPlayback({
    autoPlay,
    cacheKey,
    ready: Boolean(svgs),
    totalStrokes,
  })

  /** Per-glyph stroke offsets so we can compute global active stroke -> local. */
  const offsets = useMemo(() => (svgs ? getAnimCjkStrokeOffsets(svgs) : []), [svgs])

  // ---- Render ----
  if (error) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-muted-foreground", className)}>
        笔顺 SVG 加载失败：{error}
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

      <KanaStrokeControls
        activeStroke={activeStroke}
        totalStrokes={totalStrokes}
        isPaused={isPaused}
        speedLabel={speedLabel}
        onPrev={handlePrev}
        onTogglePause={handleTogglePause}
        onNext={handleNext}
        onReplay={handleReplay}
        onCycleSpeed={handleCycleSpeed}
      />
    </div>
  )
}
