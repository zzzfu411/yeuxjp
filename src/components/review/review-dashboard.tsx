"use client"

import { Button } from "@/components/ui/button"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { LearningDataPanel } from "@/components/review/learning-data-panel"
import { RecentMistakes } from "@/components/review/recent-mistakes"
import { ReviewDeckCard } from "@/components/review/review-deck-card"
import { FirstReviewBanner, ReviewStreakBanner, TodayReviewPanel } from "@/components/review/review-banners"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
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
    enrollMissing: number
    recent: MistakeItem[]
    saveError: boolean
    onStart: () => void
    onEnrollMissing: () => void
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
          startTestId="review-start-kana"
          extra={
            kana.enrollMissing > 0 ? (
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
          startTestId="review-start-vocab"
          extra={
            vocab.enrollMissing > 0 ? (
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
          startTestId="review-start-mistakes"
          extra={
            mistakes.enrollMissing > 0 ? (
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={mistakes.onEnrollMissing}>
                初始化复习（{mistakes.enrollMissing}）
              </Button>
            ) : mistakes.total ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={mistakes.onClear}>
                清空错题本
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">暂无错题</div>
            )
          }
        />
      </div>

      <PracticeSaveError show={mistakes.saveError} />

      {!!mistakes.total && <RecentMistakes mistakes={mistakes.recent} onRemove={mistakes.onRemove} />}

      <LearningDataPanel />
    </div>
  )
}
