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
    <div className="grid w-full grid-cols-1 gap-x-5 sm:grid-cols-2">
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
            className={cn(
              getAnswerOptionClassName(feedback),
              "min-h-16 h-auto justify-between whitespace-normal rounded-none border-x-0 border-t-0 border-b border-dashed border-border/70 bg-transparent px-3 text-left text-lg font-medium shadow-none hover:translate-y-0 hover:bg-primary/10",
              feedback === "correct" && "border-foreground/60 bg-primary/10 text-foreground hover:bg-primary/10 disabled:opacity-100",
              feedback === "wrong" && "border-accent/70 bg-accent/10 text-accent hover:bg-accent/10 disabled:opacity-100"
            )}
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
