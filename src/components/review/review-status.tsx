"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { ReviewCompletionStats } from "@/lib/review-session"

export function ReviewLoadingState({ label }: { label: string }) {
  return (
    <div className="container py-20 px-4 mx-auto max-w-lg flex flex-col items-center space-y-4">
      <div className="paper-sheet aspect-square w-full max-w-[16rem] animate-pulse border-dashed opacity-50" />
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

export function ReviewErrorState({
  title,
  message,
  onExit,
  onRetry,
}: {
  title: string
  message: string
  onExit: () => void
  onRetry?: () => void
}) {
  return (
    <div className="container py-20 px-4 mx-auto max-w-lg flex flex-col items-center space-y-5 text-center">
      <div className="paper-slip border-destructive/30 bg-destructive/5 px-5 py-4">
        <div className="font-brush text-2xl text-destructive">{title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{message}</div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <Button type="button" onClick={onRetry} data-testid="review-retry-load">
            重试加载
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onExit}>
          返回复习
        </Button>
      </div>
    </div>
  )
}

export function ReviewEmptyQuestionState({
  title,
  message,
  onExit,
  onRetry,
}: {
  title: string
  message: string
  onExit: () => void
  onRetry?: () => void
}) {
  return (
    <ReviewErrorState
      title={title}
      message={message}
      onExit={onExit}
      onRetry={onRetry}
    />
  )
}

export function ReviewDone({
  title,
  onExit,
  stats,
}: {
  title: string
  onExit: () => void
  stats?: ReviewCompletionStats
}) {
  const accuracy = stats?.answered ? Math.round((stats.correct / stats.answered) * 100) : null

  return (
    <div
      className="container py-16 px-4 mx-auto max-w-lg flex flex-col items-center space-y-6"
      data-testid={stats ? "review-complete-state" : "review-invalidated-state"}
    >
      <div className="completion-burst h-44 w-56 sm:h-56 sm:w-72" aria-hidden="true">
        <span className="completion-burst-main">✓</span>
        <span className="completion-burst-line completion-burst-line-a" />
        <span className="completion-burst-line completion-burst-line-b" />
        <span className="completion-burst-line completion-burst-line-c" />
      </div>
      <div className="space-y-2 text-center">
        <div className="eyebrow">{stats ? "Review complete" : "Review paused"}</div>
        <div className="font-brush text-3xl">{title}</div>
        <div className="text-sm text-muted-foreground">
          {stats
            ? `本轮复习 ${stats.initial} 项，共作答 ${stats.answered} 次：答对 ${stats.correct} 次，正确率 ${accuracy ?? 0}%；${stats.repeated} 次答错后重新排队。`
            : "学习数据在本轮期间发生了变化。请返回复习页重新开始。"}
        </div>
        {stats ? (
          <div className="text-xs text-muted-foreground">
            {stats.repeated > 0 ? "有些内容答错过，建议稍后再复习一次。" : "状态不错，可以继续下一课或做一组测验。"}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={onExit}>返回复习</Button>
        <Button asChild variant="outline">
          <Link href="/path">查看学习路径</Link>
        </Button>
      </div>
    </div>
  )
}
