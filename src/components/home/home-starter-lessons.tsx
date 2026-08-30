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
import { useLearningProfile } from "@/lib/learning-progress"

export function HomeStarterLessons({
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
  const [openOverrides, setOpenOverrides] = useState<Partial<Record<LessonTrack, boolean>>>({})

  if (!profileLoaded) {
    return <div className="px-3 py-8 text-sm text-muted-foreground">正在读取课表...</div>
  }

  return (
    <div className="border-y border-border/50">
      {STARTER_LESSONS.map((lesson, index) => {
        const status = getLessonEntryStatus(lesson, completedLessonIds, activeLessonId, kanaLevel)
        const done = status === "done"
        const skipped = status === "skipped"
        const active = status === "active"
        const locked = status === "locked"
        const title = lesson.title.replace(/^Day \d+：/, "")
        const phase = getLessonCoursePhase(lesson)
        const prev = STARTER_LESSONS[index - 1]
        const showPhaseHeader = !prev || prev.track !== lesson.track
        const phaseOpen = openOverrides[lesson.track] ?? lesson.track === activePhase.track
        const progress = showPhaseHeader
          ? countPhaseProgress(STARTER_LESSONS, completedLessonIds, lesson.track, kanaLevel)
          : null
        const className = cn(
          "ledger-row group flex items-center gap-4 border-b border-border/35 px-2 py-3.5 transition-colors",
          !locked && "hover:bg-muted/35",
          active && "border-l-2 border-l-accent bg-accent/[0.06] pl-[calc(0.5rem-2px)]",
          done && "text-foreground/75",
          skipped && "bg-muted/20",
          locked && "cursor-default opacity-45"
        )
        const body = (
          <>
            <span className="font-scribble w-9 shrink-0 text-base text-muted-foreground">{String(lesson.order).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold sm:text-base">{title}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{lesson.subtitle}</div>
            </div>
            <span className={cn("font-scribble shrink-0 text-sm text-muted-foreground", active && "text-accent")}>
              {getLessonEntryBadge(status)}
            </span>
          </>
        )

        return (
          <div key={lesson.id}>
            {showPhaseHeader && progress ? (
              <button
                type="button"
                data-testid={`course-phase-${phase.id}`}
                aria-expanded={phaseOpen}
                onClick={() =>
                  setOpenOverrides((current) => ({
                    ...current,
                    [lesson.track]: !(current[lesson.track] ?? lesson.track === activePhase.track),
                  }))
                }
                className="flex w-full items-center justify-between gap-3 border-b border-border/50 bg-muted/20 px-2 py-3 text-left hover:bg-muted/35"
              >
                <div>
                  <div className="eyebrow">{phase.range}</div>
                  <div className="mt-0.5 font-semibold">{phase.label}</div>
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
                      {body}
                    </div>
                  )
                }
                return (
                  <Link href={`/learn/${lesson.id}`} className={className}>
                    {body}
                  </Link>
                )
              })()
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
