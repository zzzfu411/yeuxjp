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
  const invalidatedRef = useRef(false)
  const [queue, setQueue] = useState<T[]>(() => initialQueue)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null)
  const [initialCount] = useState(initialQueue.length)
  const [stats, setStats] = useState(createReviewStats)
  const [isInvalidated, setIsInvalidated] = useState(false)
  // Increment only when the queue advances, so a requeued item gets a fresh
  // autoplay/cancellation token without replaying while answer feedback is visible.
  const [presentationVersion, setPresentationVersion] = useState(0)

  const currentItem = queue[0] ?? null
  const isComplete = queue.length === 0
  const isAnswered = selectedAnswer != null

  const completionStats = useMemo(() => {
    return getReviewCompletionStats(initialCount, stats)
  }, [initialCount, stats])

  useEffect(() => {
    const invalidate = () => {
      invalidatedRef.current = true
      answerPendingRef.current = false
      setIsInvalidated(true)
      setQueue([])
      setPresentationVersion((prev) => prev + 1)
      setSelectedAnswer(null)
      setLastAnswerCorrect(null)
    }

    const removeLearningStoreListener = addLearningStoreListener((detail) => {
      if (!shouldInvalidateReviewSession(detail.action, detail.keys)) return
      invalidate()
    })

    const onStorage = (event: StorageEvent) => {
      if (!shouldInvalidateReviewSession("storage", event.key ? [event.key] : [])) return
      invalidate()
    }

    window.addEventListener("storage", onStorage)

    return () => {
      removeLearningStoreListener()
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const recordAnswer = useCallback((answer: string, correct: boolean, beforeCommit?: () => boolean) => {
    if (invalidatedRef.current || selectedAnswer != null || answerPendingRef.current) return false
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
    // Consume the answer token synchronously so rapid activations cannot process two queue items.
    if (!answerPendingRef.current || lastAnswerCorrect === null) return
    answerPendingRef.current = false
    setQueue((prev) => advanceReviewQueue(prev, lastAnswerCorrect))
    setPresentationVersion((prev) => prev + 1)
    setSelectedAnswer(null)
    setLastAnswerCorrect(null)
  }, [lastAnswerCorrect])

  const dropCurrent = useCallback(() => {
    setQueue((prev) => dropCurrentReviewItem(prev))
    setPresentationVersion((prev) => prev + 1)
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
    presentationVersion,
    recordAnswer,
    advance,
    dropCurrent,
  }
}
