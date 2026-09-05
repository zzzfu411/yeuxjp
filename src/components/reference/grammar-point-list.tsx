"use client"

import type { GrammarPoint, Level } from "@/data/grammar-data"

export function GrammarPointList({ points, activeLevel, onOpen }: {
  points: GrammarPoint[]
  activeLevel: Level
  onOpen: (index: number) => void
}) {
  return <div className="grid gap-4 sm:grid-cols-2">
    {points.map((point, index) => <button
      key={point.id}
      type="button"
      onClick={() => onOpen(index)}
      aria-haspopup="dialog"
      data-testid={`grammar-point-${point.id}`}
      className="paper-slip grammar-card group relative flex cursor-pointer flex-col"
    >
      <span className="paper-tape" aria-hidden="true" />
      <span className="flex w-full flex-col gap-3 p-5 text-left">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-lg font-semibold" lang="ja">{point.title}</span>
          <span className="text-xs text-muted-foreground">{activeLevel}</span>
        </span>
        <span className="line-clamp-2 text-sm leading-6 text-muted-foreground">{point.explanation}</span>
        <span className="border-y border-border/35 py-2">
          <span className="mr-2 text-xs text-muted-foreground">结构</span>
          <code className="font-jp text-sm" lang="ja">{point.structure}</code>
        </span>
        <span className="text-xs text-muted-foreground">查看完整解释、例句与练习 →</span>
      </span>
    </button>)}
  </div>
}
