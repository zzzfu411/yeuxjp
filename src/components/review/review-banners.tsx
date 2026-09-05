"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReviewDashboardProps } from "@/components/review/review-dashboard"

export function FirstReviewBanner() {
  return (
    <div className="paper-sheet review-hero-card relative flex w-full flex-col items-center gap-6 p-6 sm:flex-row sm:pr-8" data-testid="review-empty-state">
      <span className="paper-tape" aria-hidden />
      <ReviewOrbitArt className="h-32 w-40 shrink-0 sm:h-40 sm:w-48" />
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div className="font-brush text-2xl">还没有复习内容</div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          将假名或单词<span className="font-semibold text-foreground">标记为「已掌握」</span>后，它们会自动加入间隔复习。
          先学几个，再回来复习。
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2 sm:justify-start">
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/kana">
              去学五十音 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/vocabulary">浏览单词卡</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ReviewStreakBanner({
  totalDue,
  totalEnrolled,
  nextDueLabel,
}: {
  totalDue: number
  totalEnrolled: number
  nextDueLabel: string
}) {
  return (
    <div
      className="paper-sheet review-hero-card relative w-full overflow-hidden"
      data-testid={totalDue > 0 ? "review-due-state" : "review-scheduled-empty-state"}
    >
      <ReviewOrbitArt className="absolute inset-y-0 right-3 hidden w-64 opacity-45 sm:block" />
      <div className="relative grid grid-cols-1 items-center gap-4 p-6 sm:grid-cols-[1fr_auto] sm:pr-10">
        <div className="space-y-1">
          <div className="eyebrow">今日复习 · Today</div>
          <div className="font-brush text-3xl text-foreground sm:text-4xl">
            <span className="text-accent">{totalDue}</span> 张到期
            <span className="text-base font-normal text-muted-foreground"> · 共 {totalEnrolled} 张</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalDue > 0 ? "从下面任选一组，先复习 5 分钟。" : `今天没有到期内容。下一次复习：${nextDueLabel}。`}
          </p>
        </div>
      </div>
    </div>
  )
}

export function TodayReviewPanel({
  todayQueueLength,
  counts,
  nextDueLabel,
  onStartToday,
}: {
  todayQueueLength: number
  counts: ReviewDashboardProps["counts"]
  nextDueLabel: string
  onStartToday: () => void
}) {
  return (
    <div
      className="paper-sheet today-review-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
      data-testid={todayQueueLength ? "review-today-due" : "review-today-empty"}
    >
      <div className="space-y-1">
        <div className="font-brush text-2xl">今日复习</div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          到期的假名、单词和错题会排在一起，容易忘的内容优先。完成后，系统会安排下次复习。
        </p>
        <div className="text-xs text-muted-foreground">
          错题 {counts.mistakesDue} · 假名 {counts.kanaDue} · 单词 {counts.vocabDue}
          {!todayQueueLength ? ` · 下一次 ${nextDueLabel}` : null}
        </div>
      </div>
      {todayQueueLength ? (
        <Button type="button" data-testid="review-start-today" onClick={onStartToday}>
          开始今日复习
        </Button>
      ) : (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button asChild variant="outline">
            <Link href="/quiz">立即练习</Link>
          </Button>
          <Button asChild>
            <Link href="/path">继续课程</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function ReviewOrbitArt({ className }: { className?: string }) {
  return (
    <div className={`review-orbit-art ${className ?? ""}`} aria-hidden="true">
      <span className="review-orbit-ring" />
      <span className="review-orbit-card review-orbit-card-a" />
      <span className="review-orbit-card review-orbit-card-b" />
      <span className="review-orbit-dot" />
    </div>
  )
}
