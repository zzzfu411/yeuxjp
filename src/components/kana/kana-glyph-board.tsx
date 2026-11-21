"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import type { ParsedAnimCjkSvg } from "@/lib/animcjk"

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
        "inline-flex h-8 min-w-8 items-center justify-center border border-border/45 bg-background/35 px-2 text-foreground/70 transition-colors hover:bg-muted/35 hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
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
 * Renders one glyph: 田字格 background, pure React SVG strokes, and start-dot overlay.
 * Stroke progress is driven directly via React props without raw HTML injection
 * or per-instance inline style blocks; scoped SVG IDs avoid collisions when the
 * same kana appears twice on screen.
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
  const geometry = svg.geometry
  const isFinishedAll = activeStroke > svg.strokeCount

  return (
    <div
      className={cn(
        "relative h-full min-w-0 overflow-hidden border border-border/40 bg-card/40",
        flexBasis === "minor" ? "flex-[0.68]" : "flex-1",
      )}
      role="img"
      aria-label={label}
      data-testid={label ? "kana-stroke-board" : undefined}
    >
      {/* A quiet practice grid keeps stroke direction readable in both themes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--border) / 0.12) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.6,
        }}
      />

      {/* 田字格 (Tian-zi grid) — pure CSS, no asset */}
      {showGrid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2"
          style={{
            backgroundImage: [
              "linear-gradient(to right, transparent calc(50% - 0.5px), hsl(var(--muted-foreground) / 0.22) calc(50% - 0.5px), hsl(var(--muted-foreground) / 0.22) calc(50% + 0.5px), transparent calc(50% + 0.5px))",
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
              ["--stroke-draw-ms" as string]: `${drawMs}ms`,
              ["--active-stroke" as string]: activeStroke,
            } as React.CSSProperties
          }
        >
          {geometry && (
            <svg
              aria-hidden
              className="acjk"
              viewBox={svg.viewBox}
              preserveAspectRatio="xMidYMid meet"
            >
              {geometry.basePaths.map((basePath) => (
                <path key={basePath.id} id={`${scopeId}-${basePath.id}`} d={basePath.d} />
              ))}
              <defs>
                {geometry.clipPaths.map((clip) => (
                  <clipPath key={clip.id} id={`${scopeId}-${clip.id}`}>
                    <use href={`#${scopeId}-${clip.href}`} />
                  </clipPath>
                ))}
              </defs>
              {geometry.strokes.map((stroke, idx) => {
                const isReached = isFinishedAll || activeStroke >= stroke.index
                const isCurrent = !isFinishedAll && activeStroke === stroke.index
                return (
                  <path
                    key={`${stroke.clipPathId}-${idx}`}
                    d={stroke.d}
                    pathLength={stroke.length}
                    clipPath={`url(#${scopeId}-${stroke.clipPathId})`}
                    data-stroke-index={stroke.index}
                    style={
                      {
                        ["--stroke-len" as string]: stroke.length,
                        ["--stroke-off" as string]: stroke.length + 2,
                        strokeDashoffset: isReached ? 0 : stroke.length + 2,
                        stroke: isCurrent ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                      } as React.CSSProperties
                    }
                  />
                )
              })}
            </svg>
          )}
        </div>

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
              if (isFinishedAll) return null
              return (
                <g key={s.index} opacity={isReached ? 1 : 0.35}>
                  <circle
                    cx={s.startX}
                    cy={s.startY}
                    r={isCurrent ? 44 : 30}
                    fill="hsl(var(--accent))"
                    className="transition-all duration-300"
                  />
                  <text
                    x={s.startX}
                    y={s.startY + 14}
                    textAnchor="middle"
                    fontSize={isCurrent ? 52 : 40}
                    fontWeight={700}
                    fill="hsl(var(--accent-foreground))"
                    className="transition-all duration-300 select-none"
                    style={{ fontFamily: "var(--font-en), cursive" }}
                  >
                    {s.index}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>
    </div>
  )
}
