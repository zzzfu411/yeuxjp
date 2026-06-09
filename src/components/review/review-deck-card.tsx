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
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
      <div className="space-y-1">
        <div className="text-lg font-bold">{title}</div>
        <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          待复习：<span className="font-semibold text-foreground">{formatReviewDueCount(due)}</span>{" "}
          <span className="text-muted-foreground/60">/ 已加入：{formatReviewDueCount(total)}</span>
        </div>
        <Button type="button" size="sm" className="rounded-full" onClick={onStart} disabled={startDisabled} data-testid={startTestId}>
          开始
        </Button>
      </div>

      {extra ? <div className="pt-1">{extra}</div> : null}
    </div>
  )
}
