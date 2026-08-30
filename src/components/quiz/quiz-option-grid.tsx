"use client"

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
import { isQuestionAnswerCorrect, type Question } from "@/lib/questions"

export function QuizOptionGrid({
  question,
  selectedOption,
  onSelect,
  testIdPrefix = "quiz-answer-option",
}: {
  question: Question
  selectedOption: string | null
  onSelect: (value: string) => void
  testIdPrefix?: string
}) {
  return (
    <div className="grid grid-cols-1 gap-4 w-full sm:grid-cols-2">
      {question.options.map((option, index) => {
        const feedback = getAnswerOptionFeedback({
          selectedAnswer: selectedOption,
          optionValue: option.value,
          isCorrectOption: isQuestionAnswerCorrect(question, option.value),
        })

        return (
          <Button
            key={option.value}
            variant="outline"
            size="lg"
            className={cn("h-auto min-h-16 whitespace-normal break-words px-3 py-3 text-lg font-medium leading-snug", getAnswerOptionClassName(feedback))}
            aria-label={getAnswerOptionAriaLabel(String(option.display), feedback)}
            aria-pressed={selectedOption === option.value}
            onClick={() => onSelect(option.value)}
            disabled={selectedOption != null}
            data-answer-value={option.value}
            data-feedback={feedback}
            data-testid={`${testIdPrefix}-${index}`}
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
