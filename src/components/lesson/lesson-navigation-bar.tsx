"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isPracticeStep, type Lesson, type LessonStep } from "@/data/lessons"

export function LessonNavigationBar({
  current,
  hasCompletedLesson,
  isLast,
  lessonUnlocked,
  loaded,
  nextLesson,
  onBack,
  onNext,
  result,
  stepIndex,
}: {
  current: LessonStep
  hasCompletedLesson: boolean
  isLast: boolean
  lessonUnlocked: boolean
  loaded: boolean
  nextLesson: Lesson | null
  onBack: () => void
  onNext: () => void
  result: "correct" | "wrong" | null
  stepIndex: number
}) {
  return (
    <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
      <Button type="button" variant="outline" className="gap-2 rounded-full" onClick={onBack} disabled={stepIndex === 0}>
        <ArrowLeft className="h-4 w-4" />
        上一步
      </Button>

      {current.type === "summary" && hasCompletedLesson ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/review" data-testid="lesson-review-link">去复习</Link>
          </Button>
          <Button asChild className="gap-2 rounded-full">
            <Link href={nextLesson ? `/learn/${nextLesson.id}` : "/"} data-testid="lesson-next-lesson-link">
              {nextLesson ? "下一课" : "回到首页"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          className="gap-2 rounded-full"
          data-testid="lesson-next"
          onClick={onNext}
          disabled={!loaded || (!lessonUnlocked && isLast) || (lessonUnlocked && isPracticeStep(current) && !result)}
        >
          {!lessonUnlocked ? (isLast ? "预览结束" : "继续预览") : isLast ? "完成课程" : "继续"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
