"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReviewDashboardProps } from "@/components/review/review-dashboard"

export function FirstReviewBanner() {
  return (
    <div className="relative w-full rounded-2xl border bg-card/80 overflow-hidden flex flex-col sm:flex-row items-center gap-6 p-6 sm:pr-8" data-testid="review-empty-state">
      <div className="relative w-40 h-32 shrink-0 sm:w-48 sm:h-40">
        <Image
          src="/assets/states/state-empty.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 160px, 192px"
          className="object-contain"
        />
      </div>
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="text-lg font-bold">还没有复习内容</div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          SRS（间隔重复）会在你<span className="font-semibold text-foreground">标记「已掌握」</span>的假名 / 单词上自动入册。
          先去学几个再回来吧。
        </p>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
          <Button asChild size="sm" className="rounded-full gap-1.5">
            <Link href="/kana">
              去学五十音 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
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
      className="relative w-full rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden"
      data-testid={totalDue > 0 ? "review-due-state" : "review-scheduled-empty-state"}
    >
      <Image
        src="/assets/review/review-streak.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-right opacity-90"
        aria-hidden
      />
      <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center p-6 sm:pr-10">
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">今日复习</div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground">
            <span className="text-primary">{totalDue}</span> 张到期
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
      className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid={todayQueueLength ? "review-today-due" : "review-today-empty"}
    >
      <div className="space-y-1">
        <div className="text-lg font-bold">今日复习流</div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          自动混合到期假名、词汇和错题，先处理最容易遗忘的内容。完成后会同步更新新的掌握度模型。
        </p>
        <div className="text-xs text-muted-foreground">
          错题 {counts.mistakesDue} · 假名 {counts.kanaDue} · 单词 {counts.vocabDue}
          {!todayQueueLength ? ` · 下一次 ${nextDueLabel}` : null}
        </div>
      </div>
      {todayQueueLength ? (
        <Button type="button" className="rounded-full" data-testid="review-start-today" onClick={onStartToday}>
          开始今日复习
        </Button>
      ) : (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/quiz">立即练习</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/path">继续课程</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
