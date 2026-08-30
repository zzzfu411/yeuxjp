"use client"

import type { KeyboardEvent } from "react"
import type { GrammarPoint, Level } from "@/data/grammar-data"

function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>, onOpen: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return

  event.preventDefault()
  onOpen()
}

export function GrammarPointList({
  points,
  activeLevel,
  onOpen,
}: {
  points: GrammarPoint[]
  activeLevel: Level
  onOpen: (index: number) => void
}) {
  return (
    <div className="grid gap-7">
      {points.map((point, index) => (
        <div
          key={point.id}
          onClick={() => onOpen(index)}
          onKeyDown={(event) => handleCardKeyDown(event, () => onOpen(index))}
          role="button"
          tabIndex={0}
          data-testid={`grammar-point-${point.id}`}
          className="paper-slip group relative flex cursor-pointer flex-col overflow-hidden"
        >
          <span className="paper-tape" aria-hidden="true" />
          <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl font-black select-none pointer-events-none group-hover:opacity-10 transition-opacity">
            {activeLevel}
          </div>

          <div className="border-b border-border/35 p-6">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <span className="font-scribble flex h-8 w-8 items-center justify-center text-lg text-accent">
                {index + 1}
              </span>
              <h2 className="text-xl font-semibold">{point.title}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed relative z-10">{point.explanation}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="border-y border-border/35 bg-primary/[0.035] p-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                结构
                <div className="h-px bg-border flex-1" />
              </div>
              <code className="font-jp block text-lg font-semibold text-foreground">{point.structure}</code>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                例句
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="grid gap-4">
                {point.examples.map((ex, i) => (
                  <div key={i} className="space-y-1 border-l-2 border-accent/35 pl-4 transition-colors hover:border-accent">
                    <div className="text-lg font-medium tracking-wide">{ex.japanese}</div>
                    <div className="text-sm text-muted-foreground italic font-serif">{ex.romaji}</div>
                    <div className="text-sm text-foreground/80">{ex.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
