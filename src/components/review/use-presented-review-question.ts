"use client"

import { useRef } from "react"
import { presentedReviewQuestion } from "@/lib/review-typed-question"

export function usePresentedReviewQuestion<T>(
  liveQuestion: T | null | undefined,
  selectedAnswer: string | null
): T | null {
  const latchedRef = useRef<T | null>(null)

  if (selectedAnswer == null) {
    latchedRef.current = liveQuestion ?? null
  }

  return presentedReviewQuestion(liveQuestion, selectedAnswer, latchedRef.current)
}
