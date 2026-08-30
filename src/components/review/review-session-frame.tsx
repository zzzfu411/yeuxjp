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
    <div className="container py-10 px-4 mx-auto max-w-lg mb-20 flex flex-col items-center space-y-6" data-testid={testId}>
      <div className="flex w-full items-center justify-between border-b border-dashed border-border/60 pb-3">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-2 px-2 text-muted-foreground shadow-none">
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
    <section className={cn("paper-sheet relative flex w-full flex-col items-center justify-center px-5 py-10", minHeightClassName)}>
      <span className="paper-tape" aria-hidden />
      {children}
    </section>
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
