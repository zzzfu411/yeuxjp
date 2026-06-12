"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { getLessonEntryBadge, getLessonEntryStatus } from "@/lib/learning-entry"
import { STARTER_LESSONS } from "@/data/lessons"

export function PathStarterLessons({
  completedLessonIds,
  activeLessonId,
}: {
  completedLessonIds: ReadonlySet<string>
  activeLessonId: string | null | undefined
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-muted-foreground tracking-wider">Starter 14 课程</div>
          <h2 className="mt-1 text-xl font-bold">从工具集合变成每日路线</h2>
        </div>
        <div className="text-sm font-semibold text-muted-foreground">
          {completedLessonIds.size}/{STARTER_LESSONS.length}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {STARTER_LESSONS.slice(0, 8).map((lesson) => {
          const status = getLessonEntryStatus(lesson, completedLessonIds, activeLessonId)
          const done = status === "done"
          const active = status === "active"
          const locked = status === "locked"
          const cardContent = (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">Day {lesson.order}</div>
                <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {getLessonEntryBadge(status)}
                </span>
              </div>
              <div className="mt-1 text-muted-foreground">{lesson.title.replace(/^Day \d+：/, "")}</div>
            </>
          )
          const className = cn(
            "rounded-xl border bg-background/70 p-3 text-sm transition hover:border-primary/50",
            done && "border-green-200 bg-green-50/70 dark:border-green-900/40 dark:bg-green-900/10",
            active && "border-primary/60 bg-primary/10",
            locked && "opacity-60 hover:border-border"
          )

          if (locked) {
            return (
              <div key={lesson.id} aria-disabled="true" className={className}>
                {cardContent}
              </div>
            )
          }

          return (
            <Link key={lesson.id} href={`/learn/${lesson.id}`} className={className}>
              {cardContent}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
