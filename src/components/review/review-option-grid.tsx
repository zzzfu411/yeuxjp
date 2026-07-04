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
  optionClassName = "h-16 text-base font-medium leading-tight",
}: {
  options: ReviewOption[]
  correctAnswer: string
  acceptedAnswers?: string[]
  selectedAnswer: string | null
  onSelect: (value: string) => void
  optionClassName?: string
}) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
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
            className={cn(optionClassName, getAnswerOptionClassName(feedback))}
            aria-label={getAnswerOptionAriaLabel(ariaLabelBase, feedback)}
            aria-pressed={selectedAnswer === option.value}
            onClick={() => onSelect(option.value)}
            disabled={selectedAnswer != null}
            data-testid={`review-answer-${option.value}`}
          >
            {option.display}
            {shouldShowCorrectAnswerIcon(feedback) && <CheckCircle2 className="ml-2 w-5 h-5" />}
            {shouldShowWrongAnswerIcon(feedback) && <XCircle className="ml-2 w-5 h-5" />}
          </Button>
        )
      })}
    </div>
  )
}
