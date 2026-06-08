"use client"

import { Button } from "@/components/ui/button"
import type { MistakeItem } from "@/lib/mistake-notebook"

interface RecentMistakesProps {
  mistakes: MistakeItem[]
  onRemove: (id: string) => void
}

export function RecentMistakes({ mistakes, onRemove }: RecentMistakesProps) {
  return (
    <div className="rounded-2xl border bg-muted/10 p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-foreground">最近错题</div>
        <div className="text-xs text-muted-foreground">点击“错题本”开始复习</div>
      </div>

      <div className="space-y-2">
        {mistakes.slice(0, 6).map((mistake) => (
          <div key={mistake.id} className="flex items-start justify-between gap-3 rounded-xl border bg-background/60 p-4">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">
                {mistake.type} · 错 {mistake.wrongCount} 次
              </div>
              <div className="text-sm font-medium break-words">{mistake.questionText ?? mistake.questionAudio ?? "（无题干）"}</div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => onRemove(mistake.id)}>
              移除
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
