"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { LearningDataPanel } from "@/components/review/learning-data-panel"
import { RecentMistakes } from "@/components/review/recent-mistakes"
import { ReviewDeckCard } from "@/components/review/review-deck-card"
import type { MistakeItem } from "@/lib/mistake-notebook"
import { formatReviewNextDueAt } from "@/lib/review-dashboard-model"

export interface ReviewDashboardProps {
  isFirstTime: boolean
  totalDue: number
  totalEnrolled: number
  nextDueAt: number | null
  todayQueueLength: number
  counts: {
    mistakesDue: number
    kanaDue: number
    vocabDue: number
  }
  kana: {
    due: number
    total: number
    mastered: number
    enrollMissing: number
    onStart: () => void
    onEnrollMissing: () => void
  }
  vocab: {
    due: number
    total: number
    learned: number
    enrollMissing: number
    onStart: () => void
    onEnrollMissing: () => void
  }
  mistakes: {
    due: number
    total: number
    recent: MistakeItem[]
    onStart: () => void
    onClear: () => void
    onRemove: (id: string) => void
  }
  onStartToday: () => void
}

export function ReviewDashboard({
  isFirstTime,
  totalDue,
  totalEnrolled,
  nextDueAt,
  todayQueueLength,
  counts,
  kana,
  vocab,
  mistakes,
  onStartToday,
}: ReviewDashboardProps) {
  const nextDueLabel = formatReviewNextDueAt(nextDueAt)

  return (
    <div className="container py-10 px-4 mx-auto max-w-4xl space-y-8 mb-20">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">复习（轻量 SRS）</h1>
        <p className="text-sm text-muted-foreground">
          只覆盖 <span className="font-semibold text-foreground">假名 / 单词 / 错题本</span>：把“学过但会忘”系统性解决。
        </p>
      </div>

      {isFirstTime ? (
        <FirstReviewBanner />
      ) : (
        <ReviewStreakBanner totalDue={totalDue} totalEnrolled={totalEnrolled} nextDueLabel={nextDueLabel} />
      )}

      <SpeechSettingsBar showQuizOptions className="max-w-3xl mx-auto" />

      <TodayReviewPanel
        todayQueueLength={todayQueueLength}
        counts={counts}
        nextDueLabel={nextDueLabel}
        onStartToday={onStartToday}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReviewDeckCard
          title="假名复习"
          desc="看假名选罗马音；错了会回到队列末尾。"
          due={kana.due}
          total={kana.total}
          onStart={kana.onStart}
          startDisabled={!kana.due}
          extra={
            kana.mastered > 0 && kana.enrollMissing > 0 ? (
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={kana.onEnrollMissing}>
                初始化复习（{kana.enrollMissing}）
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">已掌握：{kana.mastered}</div>
            )
          }
        />

        <ReviewDeckCard
          title="单词复习"
          desc="看日文选中文意思；支持自动朗读。"
          due={vocab.due}
          total={vocab.total}
          onStart={vocab.onStart}
          startDisabled={!vocab.due}
          extra={
            vocab.learned > 0 && vocab.enrollMissing > 0 ? (
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={vocab.onEnrollMissing}>
                初始化复习（{vocab.enrollMissing}）
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">已学习：{vocab.learned}</div>
            )
          }
        />

        <ReviewDeckCard
          title="错题本"
          desc="每次答错都会自动加入；复习后会被排到更后面。"
          due={mistakes.due}
          total={mistakes.total}
          onStart={mistakes.onStart}
          startDisabled={!mistakes.due}
          extra={
            mistakes.total ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={mistakes.onClear}>
                清空错题本
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">暂无错题</div>
            )
          }
        />
      </div>

      {!!mistakes.total && <RecentMistakes mistakes={mistakes.recent} onRemove={mistakes.onRemove} />}

      <LearningDataPanel />
    </div>
  )
}

function FirstReviewBanner() {
  return (
    <div className="relative w-full rounded-2xl border bg-card/80 overflow-hidden flex flex-col sm:flex-row items-center gap-6 p-6 sm:pr-8">
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

function ReviewStreakBanner({
  totalDue,
  totalEnrolled,
  nextDueLabel,
}: {
  totalDue: number
  totalEnrolled: number
  nextDueLabel: string
}) {
  return (
    <div className="relative w-full rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden">
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

function TodayReviewPanel({
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
    <div className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
