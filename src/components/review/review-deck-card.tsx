"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { formatReviewDueCount } from "@/lib/review-dashboard-model"

interface ReviewDeckCardProps {
  title: string
  desc: string
  due: number
  total: number
  onStart: () => void
  startDisabled?: boolean
  startTestId?: string
  extra?: ReactNode
}

export function ReviewDeckCard({
  title,
  desc,
  due,
  total,
  onStart,
  startDisabled,
  startTestId,
  extra,
}: ReviewDeckCardProps) {
  return (
    <article className="paper-slip review-deck-card space-y-4 p-5 pt-7">
      <span className="paper-tape" aria-hidden />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="font-brush text-2xl">{title}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
        </div>
        <div className="review-count" aria-label={`${formatReviewDueCount(due)} 项待复习`}>
          {formatReviewDueCount(due)}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-dashed border-border/60 pt-3">
        <div className="text-xs text-muted-foreground">
          已加入 {formatReviewDueCount(total)} 项
        </div>
        <Button type="button" size="sm" onClick={onStart} disabled={startDisabled} data-testid={startTestId}>
          开始
        </Button>
      </div>

      {extra ? <div className="pt-1">{extra}</div> : null}
    </article>
  )
}
