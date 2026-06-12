"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import {
  advanceReviewQueue,
  createReviewStats,
  getReviewCompletionStats,
  recordReviewAnswer,
  shouldInvalidateReviewSession,
} from "@/lib/review-session"

export function useReviewSessionState<T>(initialQueue: T[]) {
  const answerPendingRef = useRef(false)
  const [queue, setQueue] = useState<T[]>(() => initialQueue)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null)
  const [initialCount] = useState(initialQueue.length)
  const [stats, setStats] = useState(createReviewStats)
  const [isInvalidated, setIsInvalidated] = useState(false)

  const currentItem = queue[0] ?? null
  const isComplete = queue.length === 0
  const isAnswered = selectedAnswer != null

  const completionStats = useMemo(() => {
    return getReviewCompletionStats(initialCount, stats)
  }, [initialCount, stats])

  useEffect(() => {
    const onLearningStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { action?: unknown } | undefined
      if (!shouldInvalidateReviewSession(detail?.action)) return
      answerPendingRef.current = false
      setIsInvalidated(true)
      setQueue([])
      setSelectedAnswer(null)
      setLastAnswerCorrect(null)
    }

    window.addEventListener(LEARNING_STORE_EVENT, onLearningStore)
    return () => window.removeEventListener(LEARNING_STORE_EVENT, onLearningStore)
  }, [])

  const recordAnswer = useCallback((answer: string, correct: boolean, beforeCommit?: () => boolean) => {
    if (selectedAnswer != null || answerPendingRef.current) return false
    answerPendingRef.current = true

    if (beforeCommit && !beforeCommit()) {
      answerPendingRef.current = false
      return false
    }

    setSelectedAnswer(answer)
    setLastAnswerCorrect(correct)
    setStats((prev) => recordReviewAnswer(prev, correct))
    return true
  }, [selectedAnswer])

  const advance = useCallback(() => {
    setQueue((prev) => advanceReviewQueue(prev, lastAnswerCorrect))
    setSelectedAnswer(null)
    setLastAnswerCorrect(null)
    answerPendingRef.current = false
  }, [lastAnswerCorrect])

  return {
    queue,
    currentItem,
    isComplete,
    remainingCount: queue.length,
    selectedAnswer,
    lastAnswerCorrect,
    isAnswered,
    isInvalidated,
    completionStats,
    recordAnswer,
    advance,
  }
}
