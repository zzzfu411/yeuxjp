"use client"

import type { Lesson } from "@/data/lesson-types"
import { STARTER_LESSONS } from "@/data/lesson-catalog"
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
    <aside className="lesson-sidebar border-l-4 border-l-[var(--signal-pink)] bg-card/65 p-5 lg:sticky lg:top-24 lg:self-start">
      <div className="space-y-2 lg:space-y-3">
        <div className="eyebrow hidden lg:block">当前课程 · Lesson</div>
        <div>
          <h1 className="font-brush text-2xl font-normal leading-tight">{lesson.title}</h1>
          <p className="hidden lg:block mt-2 text-sm leading-relaxed text-muted-foreground">{lesson.subtitle}</p>
        </div>
        <div className="lesson-progress-track h-2 overflow-hidden bg-muted">
          <div className="h-full bg-accent transition-all" style={{ width: `${stepProgress}%` }} />
        </div>
        <div className="hidden lg:grid grid-cols-2 border-y border-border/35 text-sm">
          <div className="border-r border-border/35 p-3">
            <div className="text-xs text-muted-foreground">步骤</div>
            <div className="font-semibold">
              {stepIndex + 1}/{lesson.steps.length}
            </div>
          </div>
          <div className="p-3">
            <div className="text-xs text-muted-foreground">独立答对</div>
            <div className="font-semibold">
              {correctCount}/{practiceSteps}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground lg:hidden">步骤 {stepIndex + 1}/{lesson.steps.length} · 独立答对 {correctCount}/{practiceSteps}</p>
        {savedProgress?.status === "started" && (
          <div className="hidden lg:block border-l-2 border-primary/30 bg-primary/[0.05] p-3 text-sm leading-relaxed">
            本课已开始，练习记录会自动保存；完成后会更新课程分数。
          </div>
        )}
        {savedProgress?.status === "completed" && (
          <div className="border-l-2 border-accent/50 bg-accent/[0.05] p-3 text-sm leading-relaxed">
            已完成本课，首次分数 {savedProgress.score ?? completionScore}。
            {savedProgress.attemptId ? <span className="block">{savedProgress.attemptCompletedAt ? `本次重练 ${savedProgress.attemptScore ?? completionScore} 分` : "正在重新练习，首次记录保留"}</span> : null}
          </div>
        )}
        <div className="sr-only">N5–N2 · Day {lessonPosition}/{STARTER_LESSONS.length}</div>
      </div>
    </aside>
  )
}
