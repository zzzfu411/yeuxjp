"use client"

import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
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
}: {
  question: Question
  selectedOption: string | null
  onSelect: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {question.options.map((option) => {
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
            className={cn("h-16 text-lg font-medium", getAnswerOptionClassName(feedback))}
            onClick={() => onSelect(option.value)}
            disabled={selectedOption != null}
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
