"use client"

import { CheckCircle2, XCircle } from "lucide-react"
import { canEnrollReviewItem } from "@/lib/learning-session"
import type { LessonPracticeStep } from "@/lib/lesson-session"
import { cn } from "@/lib/utils"

export function LessonPracticeFeedback({
  step,
  result,
}: {
  step: LessonPracticeStep
  result: "correct" | "wrong"
}) {
  const showSrsEnrollment = result === "correct" && canEnrollReviewItem(step.itemType, step.itemId)

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mt-5 border-l-2 p-4 text-sm leading-relaxed",
        result === "correct"
          ? "border-primary/35 bg-primary/[0.05] text-foreground"
          : "border-destructive/60 bg-destructive/[0.07] text-foreground"
      )}
    >
      <div className="mb-1 flex items-center gap-2 font-semibold">
        {result === "correct" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {result === "correct" ? "答对了" : "再看一眼"}
      </div>
      正确答案：<span className="font-semibold">{step.answer}</span>
      {"explanation" in step && step.explanation ? <div className="mt-1">{step.explanation}</div> : null}
      {result === "wrong" ? <div className="mt-1">这道题已加入错题本，稍后会在复习页出现。</div> : null}
      {showSrsEnrollment ? (
        <div className="mt-1">已加入 SRS 复习队列，系统会在合适时间提醒巩固。</div>
      ) : null}
    </div>
  )
}
