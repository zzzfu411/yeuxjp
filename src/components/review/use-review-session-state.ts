"use client"

import { useCallback, useMemo, useState } from "react"
import {
  advanceReviewQueue,
  createReviewStats,
  getReviewCompletionStats,
  recordReviewAnswer,
} from "@/lib/review-session"

export function useReviewSessionState<T>(initialQueue: T[]) {
  const [queue, setQueue] = useState<T[]>(() => initialQueue)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null)
  const [initialCount] = useState(initialQueue.length)
  const [stats, setStats] = useState(createReviewStats)

  const currentItem = queue[0] ?? null
  const isComplete = queue.length === 0
  const isAnswered = selectedAnswer != null

  const completionStats = useMemo(() => {
    return getReviewCompletionStats(initialCount, stats)
  }, [initialCount, stats])

  const recordAnswer = useCallback((answer: string, correct: boolean) => {
    if (selectedAnswer != null) return false

    setSelectedAnswer(answer)
    setLastAnswerCorrect(correct)
    setStats((prev) => recordReviewAnswer(prev, correct))
    return true
  }, [selectedAnswer])

  const advance = useCallback(() => {
    setQueue((prev) => advanceReviewQueue(prev, lastAnswerCorrect))
    setSelectedAnswer(null)
    setLastAnswerCorrect(null)
  }, [lastAnswerCorrect])

  return {
    queue,
    currentItem,
    isComplete,
    remainingCount: queue.length,
    selectedAnswer,
    lastAnswerCorrect,
    isAnswered,
    completionStats,
    recordAnswer,
    advance,
  }
}
