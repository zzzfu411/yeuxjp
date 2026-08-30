"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReviewDashboardProps } from "@/components/review/review-dashboard"

export function FirstReviewBanner() {
  return (
    <div className="paper-sheet relative flex w-full flex-col items-center gap-6 p-6 sm:flex-row sm:pr-8" data-testid="review-empty-state">
      <span className="paper-tape" aria-hidden />
      <div className="relative w-40 h-32 shrink-0 sm:w-48 sm:h-40">
        <Image
          src="/assets/states/state-empty.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 160px, 192px"
          className="object-contain"
          priority
        />
      </div>
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div className="eyebrow">First review</div>
        <div className="font-brush text-2xl">还没有复习内容</div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          SRS（间隔重复）会在你<span className="font-semibold text-foreground">标记「已掌握」</span>的假名 / 单词上自动入册。
          先去学几个再回来吧。
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
      className="paper-sheet relative w-full overflow-hidden"
      data-testid={totalDue > 0 ? "review-due-state" : "review-scheduled-empty-state"}
    >
      <Image
        src="/assets/review/review-streak.webp"
        alt=""
        fill
        sizes="(max-width: 896px) 100vw, 896px"
        className="object-cover object-right opacity-30 mix-blend-multiply dark:opacity-20 dark:mix-blend-screen"
        aria-hidden
        priority
      />
      <div className="relative grid grid-cols-1 items-center gap-4 p-6 sm:grid-cols-[1fr_auto] sm:pr-10">
        <div className="space-y-1">
          <div className="eyebrow">今日复习 · Today</div>
          <div className="font-brush text-3xl text-foreground sm:text-4xl">
            <span className="text-accent">{totalDue}</span> 张到期
            <span className="text-base font-normal text-muted-foreground"> · 共 {totalEnrolled} 张</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalDue > 0 ? "建议从下面任一卡组开始 5 分钟。" : `今天没有到期内容。下一次复习：${nextDueLabel}。`}
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
      className="paper-sheet flex flex-col gap-4 border-l-2 border-l-accent/50 p-5 sm:flex-row sm:items-center sm:justify-between"
      data-testid={todayQueueLength ? "review-today-due" : "review-today-empty"}
    >
      <div className="space-y-1">
        <div className="font-brush text-2xl">今日复习流</div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          自动混合到期假名、词汇和错题，先处理最容易遗忘的内容。完成后会同步更新新的掌握度模型。
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
