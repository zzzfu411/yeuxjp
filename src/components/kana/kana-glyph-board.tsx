"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import { generateActiveStrokeCss, type ParsedAnimCjkSvg } from "@/lib/animcjk"

type SpeedValue = 1.6 | 1 | 0.6

export function ControlBtn({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex items-center justify-center h-7 px-2 rounded-md border border-border bg-background/80 text-foreground/80 hover:text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-30 disabled:pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  )
}

interface KanaGlyphBoardProps {
  svg: ParsedAnimCjkSvg
  activeStroke: number // 0..svg.strokeCount, local
  showGrid: boolean
  showStartDots: boolean
  isSmall: boolean
  flexBasis: "major" | "minor"
  speed: SpeedValue
  isPaused: boolean
  label?: string
}

/**
 * Renders one glyph: 田字格 background, SVG strokes, and start-dot overlay.
 * The SVG itself is injected via dangerouslySetInnerHTML. We expose stroke
 * progress through a wrapper class so a single <style> block (rendered
 * inline below) can control the entire animation. Each stroke path has
 * `data-stroke-index="N"`. We toggle visibility/animation based on the
 * activeStroke prop.
 */
export function KanaGlyphBoard({
  svg,
  activeStroke,
  showGrid,
  showStartDots,
  isSmall,
  flexBasis,
  speed,
  isPaused,
  label,
}: KanaGlyphBoardProps) {
  // Single-stroke draw duration (ms). Matches AnimCJK baseline.
  const drawMs = Math.round(800 * speed)
  const rawScopeId = useId()
  const scopeId = `kana-stroke-${rawScopeId.replace(/[^a-zA-Z0-9_-]/g, "")}`

  return (
    <div
      className={cn(
        "relative min-w-0 h-full rounded-xl bg-card/60 overflow-hidden",
        flexBasis === "minor" ? "flex-[0.68]" : "flex-1",
        // Subtle inner border so the board reads as a card on any bg
        "ring-1 ring-border/60"
      )}
      role="img"
      aria-label={label}
    >
      {/* Washi paper texture — tiled at low opacity. Only shows in light mode
          (paper-washi-tile is a warm cream tone that fights with dark bg). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          backgroundImage: "url(/assets/textures/paper-washi-tile.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          opacity: 0.35,
          mixBlendMode: "multiply",
        }}
      />

      {/* 田字格 (Tian-zi grid) — pure CSS, no asset */}
      {showGrid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 rounded-lg"
          style={{
            // Outer dashed border + crosshair
            backgroundImage: [
              // vertical center line
              "linear-gradient(to right, transparent calc(50% - 0.5px), hsl(var(--muted-foreground) / 0.22) calc(50% - 0.5px), hsl(var(--muted-foreground) / 0.22) calc(50% + 0.5px), transparent calc(50% + 0.5px))",
              // horizontal center line
              "linear-gradient(to bottom, transparent calc(50% - 0.5px), hsl(var(--muted-foreground) / 0.22) calc(50% - 0.5px), hsl(var(--muted-foreground) / 0.22) calc(50% + 0.5px), transparent calc(50% + 0.5px))",
            ].join(","),
            border: "1px dashed hsl(var(--muted-foreground) / 0.25)",
          }}
        />
      )}

      <div
        className={cn(
          "absolute inset-0 p-3",
          isSmall && "p-6"
        )}
      >
        <div
          data-active-stroke={activeStroke}
          data-paused={isPaused ? "true" : "false"}
          data-stroke-scope={scopeId}
          className="kana-glyph-svg relative w-full h-full [&_svg]:w-full [&_svg]:h-full [&_svg]:block [&_svg]:overflow-visible"
          style={
            {
              // CSS variables consumed by the inline <style> block below.
              ["--stroke-draw-ms" as string]: `${drawMs}ms`,
              ["--active-stroke" as string]: activeStroke,
            } as React.CSSProperties
          }
          // svg.html has no <script>/<style> blocks anymore (stripped in parseAnimCJK)
          dangerouslySetInnerHTML={{ __html: svg.html }}
        />

        {/* Start-dot overlay */}
        {showStartDots && (
          <svg
            aria-hidden
            className="absolute inset-3 pointer-events-none"
            viewBox={svg.viewBox}
            preserveAspectRatio="xMidYMid meet"
          >
            {svg.starts.map((s) => {
              const isReached = activeStroke >= s.index
              const isCurrent = activeStroke === s.index
              const isFinishedAll = activeStroke > svg.strokeCount
              // Hide all dots once the glyph is complete so the finished form
              // reads cleanly without numbering.
              if (isFinishedAll) return null
              return (
                <g key={s.index} opacity={isReached ? 1 : 0.35}>
                  <circle
                    cx={s.startX}
                    cy={s.startY}
                    r={isCurrent ? 44 : 30}
                    fill="hsl(var(--primary))"
                    className="transition-all duration-300"
                  />
                  <text
                    x={s.startX}
                    y={s.startY + 14}
                    textAnchor="middle"
                    fontSize={isCurrent ? 52 : 40}
                    fontWeight={700}
                    fill="hsl(var(--primary-foreground))"
                    className="transition-all duration-300 select-none"
                    style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                  >
                    {s.index}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* Dynamic per-active-stroke rules + base styles. We inline these so the
          wrapper's [data-active-stroke="N"] selector cascades to each stroke
          path. Multi-glyph combos (e.g. きゃ) each animate independently via
          their own ancestor's data-active-stroke value. */}
      <style
        dangerouslySetInnerHTML={{
          __html: generateActiveStrokeCss(svg.strokeCount, scopeId),
        }}
      />
    </div>
  )
}
