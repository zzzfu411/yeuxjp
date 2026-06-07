"use client"

import { CheckCircle2, XCircle } from "lucide-react"
import type { LessonPracticeStep } from "@/lib/lesson-session"
import { cn } from "@/lib/utils"

export function LessonPracticeFeedback({
  step,
  result,
}: {
  step: LessonPracticeStep
  result: "correct" | "wrong"
}) {
  return (
    <div
      className={cn(
        "mt-5 rounded-2xl border p-4 text-sm leading-relaxed",
        result === "correct"
          ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200"
      )}
    >
      <div className="mb-1 flex items-center gap-2 font-semibold">
        {result === "correct" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {result === "correct" ? "答对了" : "再看一眼"}
      </div>
      正确答案：<span className="font-semibold">{step.answer}</span>
      {"explanation" in step && step.explanation ? <div className="mt-1">{step.explanation}</div> : null}
      {result === "wrong" ? <div className="mt-1">这道题已加入错题本，稍后会在复习页出现。</div> : null}
      {result === "correct" && (step.itemType === "kana" || step.itemType === "vocab") ? (
        <div className="mt-1">已加入 SRS 复习队列，系统会在合适时间提醒巩固。</div>
      ) : null}
    </div>
  )
}
