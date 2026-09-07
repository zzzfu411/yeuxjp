"use client"

import { useState } from "react"
import { presentedReviewQuestion } from "@/lib/review-typed-question"

export function usePresentedReviewQuestion<T>(
  liveQuestion: T | null | undefined,
  selectedAnswer: string | null
): T | null {
  const live = liveQuestion ?? null
  const [latchedQuestion, setLatchedQuestion] = useState<T | null>(live)

  if (selectedAnswer == null && latchedQuestion !== live) {
    setLatchedQuestion(live)
  }

  return presentedReviewQuestion(live, selectedAnswer, latchedQuestion)
}
