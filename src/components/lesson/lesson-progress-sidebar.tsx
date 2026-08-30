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
    <aside className="border-l border-border/50 pl-5 lg:sticky lg:top-24 lg:self-start">
      <div className="space-y-3">
        <div className="eyebrow">当前课程 · Lesson</div>
        <div>
          <h1 className="font-brush text-2xl font-normal leading-tight">{lesson.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lesson.subtitle}</p>
        </div>
        <div className="h-px overflow-hidden bg-border/45">
          <div className="h-full bg-accent transition-all" style={{ width: `${stepProgress}%` }} />
        </div>
        <div className="grid grid-cols-2 border-y border-border/35 text-sm">
          <div className="border-r border-border/35 p-3">
            <div className="text-xs text-muted-foreground">步骤</div>
            <div className="font-semibold">
              {stepIndex + 1}/{lesson.steps.length}
            </div>
          </div>
          <div className="p-3">
            <div className="text-xs text-muted-foreground">练习正确</div>
            <div className="font-semibold">
              {correctCount}/{practiceSteps}
            </div>
          </div>
        </div>
        {savedProgress?.status === "started" && (
          <div className="border-l-2 border-primary/30 bg-primary/[0.05] p-3 text-sm leading-relaxed">
            已开始本课。系统会保留本课练习记录；继续完成后会更新课程分数。
          </div>
        )}
        {savedProgress?.status === "completed" && (
          <div className="border-l-2 border-accent/50 bg-accent/[0.05] p-3 text-sm leading-relaxed">
            已完成本课，上次分数 {savedProgress.score ?? completionScore}。
          </div>
        )}
        <div className="sr-only">N5–N2 · Day {lessonPosition}/{STARTER_LESSONS.length}</div>
      </div>
    </aside>
  )
}
