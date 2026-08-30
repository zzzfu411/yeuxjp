"use client"

import Image from "next/image"
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
      <div className="relative w-56 h-44 sm:w-72 sm:h-56">
        <Image
          src="/assets/states/state-complete.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 224px, 288px"
          className="object-contain"
          priority
        />
      </div>
      <div className="space-y-2 text-center">
        <div className="eyebrow">Review complete</div>
        <div className="font-brush text-3xl">{title}</div>
        <div className="text-sm text-muted-foreground">
          {stats
            ? `本轮 ${stats.answered}/${stats.initial} 题已处理，正确率 ${accuracy ?? 0}%，重排 ${stats.repeated} 项。`
            : "今天的任务完成啦。也可以去技能树继续推进。"}
        </div>
        {stats ? (
          <div className="text-xs text-muted-foreground">
            {stats.repeated > 0 ? "建议稍后再回到复习页处理重排内容。" : "状态很好，可以继续下一课或做一轮轻量测验。"}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={onExit}>返回</Button>
        <Button asChild variant="outline">
          <Link href="/path">打开技能树</Link>
        </Button>
      </div>
    </div>
  )
}
