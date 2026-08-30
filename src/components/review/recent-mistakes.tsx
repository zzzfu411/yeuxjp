"use client"

import { Button } from "@/components/ui/button"
import type { MistakeItem } from "@/lib/mistake-notebook"
import { mistakeReviewDeckLabel } from "@/lib/today-review-session"

interface RecentMistakesProps {
  mistakes: MistakeItem[]
  onRemove: (id: string) => void
}

export function RecentMistakes({ mistakes, onRemove }: RecentMistakesProps) {
  return (
    <section className="paper-sheet space-y-4 p-6" data-testid="recent-mistakes">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Mistake notes</div>
          <div className="font-brush text-2xl text-foreground">最近错题</div>
        </div>
        <div className="hidden text-xs text-muted-foreground sm:block">点击“错题本”开始复习</div>
      </div>

      <div>
        {mistakes.slice(0, 6).map((mistake) => (
          <div key={mistake.id} className="ledger-row flex items-start justify-between gap-3 px-1 py-4" data-testid={`recent-mistake-${mistake.id}`}>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">
                {mistakeReviewDeckLabel(mistake)} · 错 {mistake.wrongCount} 次
              </div>
              <div className="text-sm font-medium break-words">{mistake.questionText ?? mistake.questionAudio ?? "（无题干）"}</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 border-transparent px-2 text-muted-foreground shadow-none hover:text-accent"
              data-testid={`recent-mistake-remove-${mistake.id}`}
              onClick={() => onRemove(mistake.id)}
            >
              移除
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
