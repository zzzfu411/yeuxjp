"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Lesson } from "@/data/lesson-types"

export function LessonLockedPreview({ recommendedLesson }: { recommendedLesson: Pick<Lesson, "id"> | null }) {
  return (
    <div className="paper-slip relative mb-7 p-5 text-sm" data-testid="lesson-locked-preview">
      <span className="paper-tape" aria-hidden="true" />
      <div className="font-semibold">这节课还没有解锁</div>
      <p className="mt-1 leading-relaxed text-muted-foreground">
        你可以预览本课，但预览不会计入学习进度。请先完成前面的课程，再回来学习。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {recommendedLesson ? (
          <Button asChild size="sm">
            <Link href={`/learn/${recommendedLesson.id}`}>去推荐课程</Link>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline">
          <Link href="/path">查看学习路径</Link>
        </Button>
      </div>
    </div>
  )
}
