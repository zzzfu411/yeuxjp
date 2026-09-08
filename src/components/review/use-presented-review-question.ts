"use client"

import { useState } from "react"
import { presentedReviewQuestion, reviewQuestionPresentationKey } from "@/lib/review-typed-question"

export function usePresentedReviewQuestion<
  T extends { options: { value: string }[]; correctAnswer: string; mistakeId?: string; itemId?: string; questionText?: string },
>(
  liveQuestion: T | null | undefined,
  selectedAnswer: string | null,
  presentationIdentity?: string | number | null
): T | null {
  const live = liveQuestion ?? null
  const liveKey = reviewQuestionPresentationKey(live, presentationIdentity)
  const [latchedQuestion, setLatchedQuestion] = useState<T | null>(live)
  const [latchedKey, setLatchedKey] = useState(liveKey)

  if (selectedAnswer == null && latchedKey !== liveKey) {
    setLatchedQuestion(live)
    setLatchedKey(liveKey)
  }

  return presentedReviewQuestion(live, selectedAnswer, latchedQuestion)
}
