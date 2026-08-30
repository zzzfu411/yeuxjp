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
    return <div className="px-4 py-6 text-sm font-semibold text-muted-foreground">正在读取课表...</div>
  }

  return (
    <div>
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
          "flex items-center gap-3 border-b-[2px] border-foreground px-4 py-3",
          !locked && "hover:bg-primary/35",
          active && "bg-primary/50",
          done && "bg-background",
          skipped && "bg-muted/40",
          locked && "opacity-55"
        )
        const body = (
          <>
            <span className="w-8 shrink-0 font-black text-muted-foreground">{String(lesson.order).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-black">{title}</div>
              <div className="truncate text-xs font-semibold text-muted-foreground">{lesson.subtitle}</div>
            </div>
            <span className="shrink-0 border-[2px] border-foreground px-2 py-0.5 text-[10px] font-extrabold">
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
                className="flex w-full items-center justify-between gap-3 border-b-[3px] border-foreground bg-muted px-4 py-2 text-left"
              >
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-muted-foreground">{phase.range}</div>
                  <div className="font-black">{phase.label}</div>
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
