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
    <div className="flex flex-wrap items-center justify-center gap-2" data-testid="vocab-course-appearances">
      {appearances.map((item) => (
        <Link
          key={item.id}
          href={`/learn/${item.id}`}
          prefetch={false}
          onClick={(event) => event.stopPropagation()}
          className="border-[2px] border-foreground bg-background px-2 py-0.5 text-[11px] font-extrabold hover:bg-primary/40"
        >
          课表 Day {item.order}
        </Link>
      ))}
    </div>
  )
}
