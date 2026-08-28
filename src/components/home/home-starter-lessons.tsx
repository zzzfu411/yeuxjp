"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { getLessonEntryBadge, getLessonEntryStatus } from "@/lib/learning-entry"
import { STARTER_LESSONS } from "@/data/lessons"

export function HomeStarterLessons({
  completedLessonIds,
  activeLessonId,
}: {
  completedLessonIds: ReadonlySet<string>
  activeLessonId: string | null | undefined
}) {
  return (
    <div>
      {STARTER_LESSONS.map((lesson, index) => {
        const status = getLessonEntryStatus(lesson, completedLessonIds, activeLessonId)
        const done = status === "done"
        const active = status === "active"
        const locked = status === "locked"
        const title = lesson.title.replace(/^Day \d+：/, "")
        const className = cn(
          "flex items-center gap-3 border-b-[2px] border-foreground px-4 py-3",
          !locked && "hover:bg-primary/35",
          active && "bg-primary/50",
          done && "bg-background",
          locked && "opacity-55"
        )
        const body = (
          <>
            <span className="w-8 shrink-0 font-black text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-black">{title}</div>
              <div className="truncate text-xs font-semibold text-muted-foreground">{lesson.subtitle}</div>
            </div>
            <span className="shrink-0 border-[2px] border-foreground px-2 py-0.5 text-[10px] font-extrabold">
              {getLessonEntryBadge(status)}
            </span>
          </>
        )

        if (locked) {
          return (
            <div key={lesson.id} aria-disabled="true" className={className}>
              {body}
            </div>
          )
        }

        return (
          <Link key={lesson.id} href={`/learn/${lesson.id}`} className={className}>
            {body}
          </Link>
        )
      })}
    </div>
  )
}
