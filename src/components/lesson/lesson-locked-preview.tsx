"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Lesson } from "@/data/lessons"

export function LessonLockedPreview({ recommendedLesson }: { recommendedLesson: Lesson | null }) {
  return (
    <div className="hard-panel mb-6 p-4 text-sm" data-testid="lesson-locked-preview">
      <div className="font-semibold">这节课还没有解锁</div>
      <p className="mt-1 leading-relaxed text-muted-foreground">
        你可以先预览内容，但当前课程不会自动写入学习进度。建议先完成前置课程，再回来练习。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {recommendedLesson ? (
          <Button asChild size="sm" className="rounded-full">
            <Link href={`/learn/${recommendedLesson.id}`}>去推荐课程</Link>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href="/path">查看技能树</Link>
        </Button>
      </div>
    </div>
  )
}
