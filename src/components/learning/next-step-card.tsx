"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { STARTER_LESSONS } from "@/data/lesson-catalog"
import { useLearningRecommendation } from "@/lib/learning-recommendation"

export function NextStepCard({ className }: { className?: string }) {
  const { learningEntry: entry, satisfiedLessonCount } = useLearningRecommendation()

  return (
    <div
      className={cn(
        "paper-slip relative flex w-full flex-col items-start justify-between gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-7",
        className
      )}
    >
      <span className="paper-tape" aria-hidden="true" />
      <div>
        <div className="eyebrow">下一页 · Next</div>
        <div className="mt-2 text-lg font-semibold">{entry.title}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{entry.subtitle}</div>
        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
          课程已完成 {satisfiedLessonCount}/{STARTER_LESSONS.length}；系统也会参考你的假名和词汇掌握情况推荐练习。
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href={entry.href}>{entry.cta}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/path">查看学习路径</Link>
        </Button>
      </div>
    </div>
  )
}
