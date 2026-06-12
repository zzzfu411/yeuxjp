"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { addLearningStoreListener } from "@/lib/learning-events"
import {
  advanceReviewQueue,
  createReviewStats,
  dropCurrentReviewItem,
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
    const invalidate = () => {
      answerPendingRef.current = false
      setIsInvalidated(true)
      setQueue([])
      setSelectedAnswer(null)
      setLastAnswerCorrect(null)
    }

    const removeLearningStoreListener = addLearningStoreListener((detail) => {
      if (!shouldInvalidateReviewSession(detail.action)) return
      invalidate()
    })

    return () => removeLearningStoreListener()
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

  const dropCurrent = useCallback(() => {
    setQueue((prev) => dropCurrentReviewItem(prev))
    setSelectedAnswer(null)
    setLastAnswerCorrect(null)
    answerPendingRef.current = false
  }, [])

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
    dropCurrent,
  }
}
