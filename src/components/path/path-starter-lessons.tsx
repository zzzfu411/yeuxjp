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
      <div className="py-8">
        <div className="text-sm text-muted-foreground">正在读取课表...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">
            N5–N2 · {STARTER_LESSONS.length} 天路径
          </div>
          <h2 className="mt-2 text-xl font-semibold">一页一课，循序展卷</h2>
        </div>
        <div className="font-scribble text-base text-muted-foreground">
          {satisfiedCount}/{STARTER_LESSONS.length}
        </div>
      </div>
      <div className="mt-5 border-y border-border/50">
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
              <div className="flex min-w-0 flex-1 items-baseline gap-3">
                <span className="font-scribble w-12 shrink-0 text-sm text-muted-foreground">Day {lesson.order}</span>
                <span className="truncate text-sm font-semibold">{lesson.title.replace(/^Day \d+：/, "")}</span>
              </div>
              <span className={cn("font-scribble shrink-0 text-sm text-muted-foreground", active && "text-accent")}>
                {getLessonEntryBadge(status)}
              </span>
            </>
          )
          const className = cn(
            "ledger-row flex items-center gap-4 border-b border-border/30 px-2 py-3.5 transition-colors hover:bg-muted/30",
            done && "text-foreground/75",
            skipped && "bg-muted/20",
            active && "border-l-2 border-l-accent bg-accent/[0.06] pl-[calc(0.5rem-2px)]",
            locked && "cursor-default opacity-45 hover:bg-transparent"
          )

          return (
            <div key={lesson.id}>
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
                  className="flex w-full items-center justify-between gap-3 border-b border-border/45 bg-muted/20 px-2 py-3.5 text-left hover:bg-muted/35"
                >
                  <div>
                    <div className="eyebrow">{phase.range}</div>
                    <div className="mt-0.5 font-semibold">{phase.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{phase.short}</div>
                  </div>
                  <div className="font-scribble text-sm text-muted-foreground">
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
