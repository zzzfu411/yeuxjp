"use client"

import { ConjugationComparison, ParticleFillFeedback, type ConjugationVerbMeta } from "@/components/quiz/feedback"
import { cn } from "@/lib/utils"
import type { Question } from "@/lib/questions"

type ReviewFeedbackQuestion = Pick<
  Question,
  "type" | "questionText" | "correctAnswer" | "correctDisplay" | "acceptedAnswers" | "explanation" | "options" | "meta"
>

function isVerbKind(value: unknown): value is ConjugationVerbMeta["kind"] {
  return value === "ichidan" || value === "godan" || value === "suru" || value === "kuru"
}

function isVerbForm(value: unknown): value is "masu" | "nai" | "te" | "ta" {
  return value === "masu" || value === "nai" || value === "te" || value === "ta"
}

function getSelectedDisplay(question: ReviewFeedbackQuestion, value: string) {
  return question.options.find((option) => option.value === value)?.display ?? value
}

function getCorrectDisplay(question: ReviewFeedbackQuestion) {
  return question.options.find((option) => option.value === question.correctAnswer)?.display ?? question.correctDisplay ?? question.correctAnswer
}

export function ReviewAnswerFeedback({
  question,
  selectedAnswer,
  correct,
  showSelectedAnswer = false,
  showSpecialFeedback = false,
}: {
  question: ReviewFeedbackQuestion
  selectedAnswer: string | null
  correct?: boolean | null
  showSelectedAnswer?: boolean
  showSpecialFeedback?: boolean
}) {
  if (!selectedAnswer) return null

  const selectedDisplay = getSelectedDisplay(question, selectedAnswer)
  const correctDisplay = getCorrectDisplay(question)
  const canShowParticle = showSpecialFeedback && question.type === "particle" && question.questionText
  const canShowConjugation =
    showSpecialFeedback &&
    question.type === "verb-conjugation" &&
    question.meta?.verb &&
    isVerbKind(question.meta.verb.kind) &&
    question.meta.askedForm &&
    isVerbForm(question.meta.askedForm.id)

  return (
    <div role="status" aria-live="polite" className="contents">
      {canShowParticle ? (
        <ParticleFillFeedback
          sentence={question.questionText!}
          selected={selectedAnswer}
          correct={question.correctAnswer}
          acceptedAnswers={question.acceptedAnswers}
        />
      ) : null}

      {canShowConjugation ? (
        <ConjugationComparison
          verb={{ ...question.meta!.verb!, kind: question.meta!.verb!.kind as ConjugationVerbMeta["kind"] }}
          askedForm={{ id: question.meta!.askedForm!.id as "masu" | "nai" | "te" | "ta", label: question.meta!.askedForm!.label }}
          selected={selectedAnswer}
          correct={question.correctAnswer}
          acceptedAnswers={question.acceptedAnswers}
        />
      ) : null}

      <div className="w-full rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed">
        {showSelectedAnswer ? (
          <>
            <div className="text-xs font-semibold text-foreground mb-1 tracking-wider">解析</div>
            <div className="space-y-2">
              <div className="text-sm">
                你的答案：<span className={cn("font-semibold", correct === true ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}>{selectedDisplay}</span>
                <span className="text-muted-foreground"> · 正确：<span className="font-semibold text-foreground">{correctDisplay}</span></span>
              </div>
              {question.explanation ? <div>{question.explanation}</div> : null}
            </div>
          </>
        ) : (
          <>
            正确答案：<span className="font-semibold text-foreground">{correctDisplay}</span>
            {question.explanation ? <div className="mt-2">{question.explanation}</div> : null}
          </>
        )}
      </div>
    </div>
  )
}
