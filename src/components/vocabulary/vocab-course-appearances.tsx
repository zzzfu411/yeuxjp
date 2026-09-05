"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { VocabLessonAppearance } from "@/lib/lesson-item-coverage"

export function VocabCourseAppearances({ vocabId }: { vocabId: string }) {
  const [appearances, setAppearances] = useState<VocabLessonAppearance[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      import("@/data/lessons"),
      import("@/lib/lesson-item-coverage"),
    ]).then(([lessons, coverage]) => {
      if (cancelled) return
      setAppearances(coverage.getVocabLessonAppearances(lessons.STARTER_LESSONS, vocabId))
    })
    return () => {
      cancelled = true
    }
  }, [vocabId])

  if (!appearances.length) return null

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1" data-testid="vocab-course-appearances">
      {appearances.map((item) => (
        <Link
          key={item.id}
          href={`/learn/${item.id}`}
          prefetch={false}
          onClick={(event) => event.stopPropagation()}
          className="font-scribble border-b border-dashed border-border/70 px-0.5 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        >
          课程 Day {item.order}
        </Link>
      ))}
    </div>
  )
}
