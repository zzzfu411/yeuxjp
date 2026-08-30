"use client"

import { useMemo, useState } from "react"
import type { LessonTrack } from "@/data/lesson-types"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getLessonEntryBadge, getLessonEntryStatus } from "@/lib/learning-entry"
import { STARTER_LESSONS } from "@/data/lessons"
import {
  countPhaseProgress,
  getActiveCoursePhase,
  getLessonCoursePhase,
} from "@/lib/course-phases"
import { countSatisfiedLessons } from "@/lib/lesson-skip"
import { useLearningProfile } from "@/lib/learning-progress"

export function PathStarterLessons({
  completedLessonIds,
  activeLessonId,
}: {
  completedLessonIds: ReadonlySet<string>
  activeLessonId: string | null | undefined
}) {
  const { profile, loaded: profileLoaded } = useLearningProfile()
  const kanaLevel = profileLoaded ? profile?.kanaLevel : undefined
  const activePhase = useMemo(
    () => getActiveCoursePhase(STARTER_LESSONS, completedLessonIds, activeLessonId, kanaLevel),
    [activeLessonId, completedLessonIds, kanaLevel]
  )
  const satisfiedCount = useMemo(
    () => countSatisfiedLessons(STARTER_LESSONS, completedLessonIds, kanaLevel),
    [completedLessonIds, kanaLevel]
  )
  const [openOverrides, setOpenOverrides] = useState<Partial<Record<LessonTrack, boolean>>>({})

  if (!profileLoaded) {
    return (
      <div className="border-[3px] border-foreground bg-card p-5 shadow-hard">
        <div className="text-sm text-muted-foreground">正在读取课表...</div>
      </div>
    )
  }

  return (
    <div className="border-[3px] border-foreground bg-card p-5 shadow-hard">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-muted-foreground tracking-wider">
            N5–N2 · {STARTER_LESSONS.length} 天路径
          </div>
          <h2 className="mt-1 text-xl font-bold">按阶段推进，而不是一次摊开 175 课</h2>
        </div>
        <div className="text-sm font-semibold text-muted-foreground">
          {satisfiedCount}/{STARTER_LESSONS.length}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {STARTER_LESSONS.map((lesson, index) => {
          const status = getLessonEntryStatus(lesson, completedLessonIds, activeLessonId, kanaLevel)
          const done = status === "done"
          const skipped = status === "skipped"
          const active = status === "active"
          const locked = status === "locked"
          const phase = getLessonCoursePhase(lesson)
          const prev = STARTER_LESSONS[index - 1]
          const showPhaseHeader = !prev || prev.track !== lesson.track
          const phaseOpen = openOverrides[lesson.track] ?? lesson.track === activePhase.track
          const progress = showPhaseHeader
            ? countPhaseProgress(STARTER_LESSONS, completedLessonIds, lesson.track, kanaLevel)
            : null
          const cardContent = (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">Day {lesson.order}</div>
                <span className="border-[2px] border-foreground bg-background px-2 py-0.5 text-[11px] font-extrabold text-muted-foreground">
                  {getLessonEntryBadge(status)}
                </span>
              </div>
              <div className="mt-1 text-muted-foreground">{lesson.title.replace(/^Day \d+：/, "")}</div>
            </>
          )
          const className = cn(
            "border-[2px] border-foreground bg-background p-3 text-sm hover:bg-primary/30",
            done && "border-green-200 bg-green-50/70 dark:border-green-900/40 dark:bg-green-900/10",
            skipped && "bg-muted/40",
            active && "border-primary/60 bg-primary/10",
            locked && "opacity-60 hover:border-border"
          )

          return (
            <div key={lesson.id} className="contents">
              {showPhaseHeader && progress ? (
                <button
                  type="button"
                  data-testid={`path-course-phase-${phase.id}`}
                  aria-expanded={phaseOpen}
                  onClick={() =>
                    setOpenOverrides((current) => ({
                      ...current,
                      [lesson.track]: !(current[lesson.track] ?? lesson.track === activePhase.track),
                    }))
                  }
                  className="col-span-full flex w-full items-center justify-between gap-3 border-[2px] border-foreground bg-muted px-3 py-2 text-left"
                >
                  <div>
                    <div className="text-[10px] font-extrabold tracking-wider text-muted-foreground">{phase.range}</div>
                    <div className="font-black">{phase.label}</div>
                    <div className="text-xs text-muted-foreground">{phase.short}</div>
                  </div>
                  <div className="text-xs font-extrabold text-muted-foreground">
                    {progress.done}/{progress.total} {phaseOpen ? "▾" : "▸"}
                  </div>
                </button>
              ) : null}
              {phaseOpen ? (
                (() => {
                  if (locked) {
                    return (
                      <div aria-disabled="true" className={className}>
                        {cardContent}
                      </div>
                    )
                  }
                  return (
                    <Link href={`/learn/${lesson.id}`} className={className}>
                      {cardContent}
                    </Link>
                  )
                })()
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
