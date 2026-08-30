"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
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
  mistakeKindDueLabel?: string
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
  mistakeKindDueLabel = "",
  kana,
  vocab,
  mistakes,
  onStartToday,
}: ReviewDashboardProps) {
  const nextDueLabel = formatReviewNextDueAt(nextDueAt)
  const [confirmClearMistakesOpen, setConfirmClearMistakesOpen] = useState(false)

  const requestClearMistakes = () => setConfirmClearMistakesOpen(true)
  const cancelClearMistakes = () => setConfirmClearMistakesOpen(false)
  const confirmClearMistakes = () => {
    setConfirmClearMistakesOpen(false)
    mistakes.onClear()
  }

  return (
    <div className="paper-wrap mb-20 space-y-10 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl space-y-2 text-center">
        <div className="eyebrow">復習 · Review</div>
        <h1 className="font-brush text-4xl font-normal sm:text-5xl"><span className="inkline">复习台</span></h1>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
          只覆盖 <span className="font-semibold text-foreground">假名 / 单词 / 错题本</span>：把“学过但会忘”系统性解决。
        </p>
      </div>

      {isFirstTime ? (
        <FirstReviewBanner />
      ) : (
        <ReviewStreakBanner totalDue={totalDue} totalEnrolled={totalEnrolled} nextDueLabel={nextDueLabel} />
      )}

      <SpeechSettingsBar showQuizOptions className="mx-auto max-w-3xl" />

      <TodayReviewPanel
        todayQueueLength={todayQueueLength}
        counts={counts}
        nextDueLabel={nextDueLabel}
        onStartToday={onStartToday}
      />

      <section aria-label="复习卡组" className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-3">
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
              <Button type="button" variant="outline" size="sm" onClick={kana.onEnrollMissing}>
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
              <Button type="button" variant="outline" size="sm" onClick={vocab.onEnrollMissing}>
                初始化复习（{vocab.enrollMissing}）
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">已学习：{vocab.learned}</div>
            )
          }
        />

        <ReviewDeckCard
          title="错题本"
          desc="假名、词汇、语法和造句答错都会进来；复习对了才会拉长间隔。"
          due={mistakes.due}
          total={mistakes.total}
          onStart={mistakes.onStart}
          startDisabled={!mistakes.due}
          startTestId="review-start-mistakes"
          extra={
            mistakes.enrollMissing > 0 || mistakes.total ? (
              <div className="flex flex-wrap items-center gap-2">
                {mistakeKindDueLabel ? (
                  <div className="text-xs text-muted-foreground">到期 {mistakeKindDueLabel}</div>
                ) : null}
                {mistakes.enrollMissing > 0 ? (
                  <Button type="button" variant="outline" size="sm" onClick={mistakes.onEnrollMissing}>
                    初始化复习（{mistakes.enrollMissing}）
                  </Button>
                ) : null}
                {mistakes.total ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-accent hover:border-accent/40 hover:bg-accent/5"
                    data-testid="mistakes-clear"
                    onClick={requestClearMistakes}
                  >
                    清空错题本
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">暂无错题</div>
            )
          }
        />
      </section>

      <PracticeSaveError show={mistakes.saveError} />

      <ConfirmActionDialog
        open={confirmClearMistakesOpen}
        title="清空错题本？"
        description="错题记录和对应的错题复习队列会被删除。课程进度、假名和词汇复习记录不会受到影响。"
        confirmLabel="清空错题"
        testId="mistakes-clear-dialog"
        onConfirm={confirmClearMistakes}
        onCancel={cancelClearMistakes}
      />

      {!!mistakes.total && <RecentMistakes mistakes={mistakes.recent} onRemove={mistakes.onRemove} />}

      <LearningDataPanel />
    </div>
  )
}
