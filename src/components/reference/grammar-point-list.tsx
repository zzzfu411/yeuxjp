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
    <div className="grid gap-8">
      {points.map((point, index) => (
        <div
          key={point.id}
          onClick={() => onOpen(index)}
          onKeyDown={(event) => handleCardKeyDown(event, () => onOpen(index))}
          role="button"
          tabIndex={0}
          data-testid={`grammar-point-${point.id}`}
          className="group relative flex cursor-pointer flex-col overflow-hidden hard-panel transition-transform hover:-translate-x-px hover:-translate-y-px"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl font-black select-none pointer-events-none group-hover:opacity-10 transition-opacity">
            {activeLevel}
          </div>

          <div className="p-6 border-b bg-secondary/30">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                {index + 1}
              </span>
              <h2 className="text-xl font-bold group-hover:text-accent transition-colors">{point.title}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed relative z-10">{point.explanation}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                结构
                <div className="h-px bg-border flex-1" />
              </div>
              <code className="text-lg font-mono font-bold text-accent block">{point.structure}</code>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                例句
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="grid gap-4">
                {point.examples.map((ex, i) => (
                  <div key={i} className="pl-4 border-l-2 border-primary/30 space-y-1 hover:border-primary transition-colors">
                    <div className="font-jp text-lg font-medium tracking-wide">{ex.japanese}</div>
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
