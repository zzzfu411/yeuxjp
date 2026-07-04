"use client"

import type { ReactNode } from "react"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ReviewSessionFrame({
  onExit,
  headerRight,
  children,
  testId,
}: {
  onExit: () => void
  headerRight: ReactNode
  children: ReactNode
  testId?: string
}) {
  return (
    <div className="container py-10 px-4 mx-auto max-w-lg flex flex-col items-center space-y-6 mb-20" data-testid={testId}>
      <div className="w-full flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Button>
        {headerRight}
      </div>
      {children}
    </div>
  )
}

export function ReviewPromptCard({
  children,
  minHeightClassName = "min-h-[220px]",
}: {
  children: ReactNode
  minHeightClassName?: string
}) {
  return (
    <div className={cn("w-full flex flex-col items-center justify-center py-10 bg-card border rounded-xl shadow-sm relative", minHeightClassName)}>
      {children}
    </div>
  )
}

export function ReviewNextButton({
  show,
  onNext,
}: {
  show: boolean
  onNext: () => void
}) {
  if (!show) return null

  return (
    <Button
      onClick={onNext}
      size="lg"
      className="w-full gap-2 animate-in fade-in slide-in-from-bottom-2"
      data-testid="review-next"
    >
      下一题 <RefreshCw className="w-4 h-4" />
    </Button>
  )
}
