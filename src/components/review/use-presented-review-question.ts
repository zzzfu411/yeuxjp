"use client"

import { useState } from "react"
import { presentedReviewQuestion, reviewQuestionPresentationKey } from "@/lib/review-typed-question"

export function usePresentedReviewQuestion<T extends { options: { value: string }[]; correctAnswer: string }>(
  liveQuestion: T | null | undefined,
  selectedAnswer: string | null
): T | null {
  const live = liveQuestion ?? null
  const [latchedQuestion, setLatchedQuestion] = useState<T | null>(live)

  if (
    selectedAnswer == null &&
    reviewQuestionPresentationKey(latchedQuestion) !== reviewQuestionPresentationKey(live)
  ) {
    setLatchedQuestion(live)
  }

  return presentedReviewQuestion(live, selectedAnswer, latchedQuestion)
}
