"use client"

import type { ReactNode } from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getAnswerOptionAriaLabel,
  getAnswerOptionClassName,
  getAnswerOptionFeedback,
  shouldShowCorrectAnswerIcon,
  shouldShowWrongAnswerIcon,
} from "@/lib/answer-option-feedback"
import { isQuestionAnswerCorrect } from "@/lib/questions"

export type ReviewOption = {
  value: string
  display: ReactNode
}

export function ReviewOptionGrid({
  options,
  correctAnswer,
  acceptedAnswers,
  selectedAnswer,
  onSelect,
  optionClassName = "text-base font-medium leading-tight",
}: {
  options: ReviewOption[]
  correctAnswer: string
  acceptedAnswers?: string[]
  selectedAnswer: string | null
  onSelect: (value: string) => void
  optionClassName?: string
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-x-5 sm:grid-cols-2">
      {options.map((option) => {
        const ariaLabelBase = typeof option.display === "string" ? option.display : option.value
        const feedback = getAnswerOptionFeedback({
          selectedAnswer,
          optionValue: option.value,
          isCorrectOption: isQuestionAnswerCorrect({ correctAnswer, acceptedAnswers }, option.value),
        })

        return (
          <Button
            key={option.value}
            variant="outline"
            size="lg"
            className={cn(
              getAnswerOptionClassName(feedback),
              "min-h-16 h-auto justify-between whitespace-normal rounded-none border-x-0 border-t-0 border-b border-dashed border-border/70 bg-transparent px-3 text-left shadow-none hover:translate-y-0 hover:bg-primary/10",
              optionClassName,
              feedback === "correct" && "border-foreground/60 bg-primary/10 text-foreground hover:bg-primary/10 disabled:opacity-100",
              feedback === "wrong" && "border-accent/70 bg-accent/10 text-accent hover:bg-accent/10 disabled:opacity-100"
            )}
            aria-label={getAnswerOptionAriaLabel(ariaLabelBase, feedback)}
            aria-pressed={selectedAnswer === option.value}
            onClick={() => onSelect(option.value)}
            disabled={selectedAnswer != null}
            data-testid={`review-answer-${option.value}`}
          >
            {option.display}
            {shouldShowCorrectAnswerIcon(feedback) && <CheckCircle2 className="ml-2 h-5 w-5 shrink-0" />}
            {shouldShowWrongAnswerIcon(feedback) && <XCircle className="ml-2 h-5 w-5 shrink-0" />}
          </Button>
        )
      })}
    </div>
  )
}
