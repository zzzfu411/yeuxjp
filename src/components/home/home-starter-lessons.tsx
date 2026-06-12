"use client"

import Link from "next/link"
import { ArrowRight, BookOpenCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground">Starter 14</div>
          <h2 className="mt-1 text-2xl font-bold">14 天入门路线</h2>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/path">查看技能树</Link>
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {STARTER_LESSONS.slice(0, 6).map((lesson) => {
          const status = getLessonEntryStatus(lesson, completedLessonIds, activeLessonId)
          const done = status === "done"
          const active = status === "active"
          const locked = status === "locked"
          const cardContent = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Day {lesson.order}</div>
                  <div className="mt-1 font-bold leading-snug">{lesson.title.replace(/^Day \d+：/, "")}</div>
                </div>
                {done ? (
                  <BookOpenCheck className="h-4 w-4 text-green-600" />
                ) : active ? (
                  <ArrowRight className="h-4 w-4 text-primary" />
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{lesson.subtitle}</p>
              <div className="mt-3 inline-flex rounded-full border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {getLessonEntryBadge(status)}
              </div>
            </>
          )

          const className = cn(
            "rounded-2xl border bg-background/70 p-4 transition hover:border-primary/50 hover:bg-primary/5",
            done && "border-green-200 bg-green-50/70 dark:border-green-900/40 dark:bg-green-900/10",
            active && "border-primary/60 bg-primary/10",
            locked && "opacity-60 hover:border-border hover:bg-background/70"
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
