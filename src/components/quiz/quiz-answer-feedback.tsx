"use client"

import Link from "next/link"
import type { VerbConjForm } from "@/lib/verb-conjugation"
import { isQuestionAnswerCorrect, type Question } from "@/lib/questions"
import { ConjugationComparison, ParticleFillFeedback, type ConjugationVerbMeta } from "@/components/quiz/feedback"
import type { QuizMode } from "@/lib/quiz-generators"

function isVerbKind(value: unknown): value is ConjugationVerbMeta["kind"] {
  return value === "ichidan" || value === "godan" || value === "suru" || value === "kuru"
}

function isVerbForm(value: unknown): value is VerbConjForm {
  return value === "masu" || value === "nai" || value === "te" || value === "ta"
}

export function QuizAnswerFeedback({
  question,
  mode,
  selectedOption,
}: {
  question: Question
  mode: QuizMode
  selectedOption: string | null
}) {
  if (!selectedOption) return null

  const canShowConj =
    mode === "verb-conjugation" &&
    question.meta?.verb &&
    isVerbKind(question.meta.verb.kind) &&
    question.meta.askedForm &&
    isVerbForm(question.meta.askedForm.id)
  const isCorrect = isQuestionAnswerCorrect(question, selectedOption)

  return (
    <div role="status" aria-live="polite" className="contents" data-testid="quiz-answer-feedback">
      {mode === "particle" && question.questionText && (
        <ParticleFillFeedback
          sentence={question.questionText}
          selected={selectedOption}
          correct={question.correctAnswer}
          acceptedAnswers={question.acceptedAnswers}
        />
      )}

      {canShowConj && (
        <ConjugationComparison
          verb={{ ...question.meta!.verb!, kind: question.meta!.verb!.kind as ConjugationVerbMeta["kind"] }}
          askedForm={{ id: question.meta!.askedForm!.id as VerbConjForm, label: question.meta!.askedForm!.label }}
          selected={selectedOption}
          correct={question.correctAnswer}
          acceptedAnswers={question.acceptedAnswers}
        />
      )}

      {question.explanation && (
        <div className="w-full rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed">
          <div className="text-xs font-semibold text-foreground mb-1 tracking-wider">解析</div>
          {question.explanation}
        </div>
      )}

      {!isCorrect && (
        <div className="w-full text-xs text-muted-foreground">
          已加入错题本，可在{" "}
          <Link href="/review" className="underline underline-offset-4">
            复习（SRS）
          </Link>{" "}
          里集中复盘。
        </div>
      )}
    </div>
  )
}
