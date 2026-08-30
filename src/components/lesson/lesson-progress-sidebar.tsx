"use client"

import type { Lesson } from "@/data/lessons"
import { STARTER_LESSONS } from "@/data/lessons"
import type { LessonProgress } from "@/lib/learning-progress-model"

interface LessonProgressSidebarProps {
  lesson: Lesson
  lessonPosition: number
  stepIndex: number
  stepProgress: number
  correctCount: number
  practiceSteps: number
  completionScore: number
  savedProgress?: LessonProgress
}

export function LessonProgressSidebar({
  lesson,
  lessonPosition,
  stepIndex,
  stepProgress,
  correctCount,
  practiceSteps,
  completionScore,
  savedProgress,
}: LessonProgressSidebarProps) {
  return (
    <aside className="hard-panel p-5 lg:sticky lg:top-24 lg:self-start">
      <div className="space-y-3">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground">当前课程</div>
        <div>
          <h1 className="text-xl font-bold leading-tight">{lesson.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lesson.subtitle}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stepProgress}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-xs text-muted-foreground">步骤</div>
            <div className="font-semibold">
              {stepIndex + 1}/{lesson.steps.length}
            </div>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-xs text-muted-foreground">练习正确</div>
            <div className="font-semibold">
              {correctCount}/{practiceSteps}
            </div>
          </div>
        </div>
        {savedProgress?.status === "started" && (
          <div className="rounded-xl border bg-primary/10 p-3 text-sm leading-relaxed">
            已开始本课。系统会保留本课练习记录；继续完成后会更新课程分数。
          </div>
        )}
        {savedProgress?.status === "completed" && (
          <div className="rounded-xl border bg-green-50 p-3 text-sm leading-relaxed text-green-800 dark:bg-green-900/20 dark:text-green-200">
            已完成本课，上次分数 {savedProgress.score ?? completionScore}。
          </div>
        )}
        <div className="sr-only">N5–N2 · Day {lessonPosition}/{STARTER_LESSONS.length}</div>
      </div>
    </aside>
  )
}
