"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { STARTER_LESSONS } from "@/data/lessons"
import { useLearningRecommendation } from "@/lib/learning-recommendation"

export function NextStepCard({ className }: { className?: string }) {
  const { learning, learningEntry: entry } = useLearningRecommendation()

  return (
    <div
      className={cn(
        "w-full border-[3px] border-foreground bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-hard",
        className
      )}
    >
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted-foreground tracking-wider">下一步推荐</div>
        <div className="text-lg font-bold">{entry.title}</div>
        <div className="text-sm text-muted-foreground">{entry.subtitle}</div>
        <div className="text-xs text-muted-foreground pt-1">
          已完成 Starter {learning.completedLessonIds.size}/{STARTER_LESSONS.length}。旧的五十音/词汇标记仍会作为兜底推荐依据。
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href={entry.href}>{entry.cta}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/path">打开技能树</Link>
        </Button>
      </div>
    </div>
  )
}
