"use client"

import { useCallback } from "react"
import { useLearningPracticeState } from "@/lib/learning-progress-practice"
import { runLearningStorageTransaction } from "@/lib/learning-storage-transaction"
import { queueLearningNotification } from "@/lib/learning-events"
import { writeLearningJson } from "@/lib/learning-storage"
import { clampScore, normalizeStepIndex } from "@/lib/learning-progress-model"
import { applyLessonStepAnswer, type LessonStepAnswer } from "@/lib/lesson-step-answers"
import { generateSafeId } from "@/lib/safe-id"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { finishLessonAttempt, restartLessonAttempt, isLessonAttemptComplete, resumeLessonUpdateAttempt, resumeLessonConsolidationAttempt } from "@/lib/lesson-attempt"
import type { Lesson } from "@/data/lesson-types"
import { readLessonProgressMapResult } from "@/lib/learning-progress-storage"
import { prepareStudyCalendarWrite } from "@/lib/study-calendar-storage"

export {
  averageMastery,
  type ItemProgress,
  type KanaLevel,
  type LearningGoal,
  type LessonProgress,
  type PracticeItemType,
  type PracticeMode,
  type PracticeResult,
  type RomajiMode,
  type UserProfile,
} from "@/lib/learning-progress-model"

export { useLearningProfile } from "@/lib/learning-profile"

export function useLearningProgress() {
  const { learning, setLessons } = useLearningPracticeState()

  const startLesson = useCallback((lessonId: string) => {
    const current = readLessonProgressMapResult()
    if (!current.ok) return false
    const base = current.value
    if (base[lessonId]) return true
    const now = Date.now()
    const next = { ...base, [lessonId]: { lessonId, status: "started" as const, startedAt: now, updatedAt: now } }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: current.raw })) return false
    setLessons(next)
    return true
  }, [setLessons])

  const completeLesson = useCallback((lessonId: string, score?: number, expectedAttempt?: { attemptId?: string; contentVersion?: string; stepVersions?: Record<string, string> }) => {
    const currentResult = readLessonProgressMapResult()
    if (!currentResult.ok) return false
    const base = currentResult.value
    const current = base[lessonId]
    if (expectedAttempt && (!current || current.attemptId !== expectedAttempt.attemptId)) return false
    if (isLessonAttemptComplete(current)) return true
    const now = Date.now()
    const next = {
      ...base,
      [lessonId]: {
        ...finishLessonAttempt(lessonId, current, typeof score === "number" ? clampScore(score) : undefined, now),
        ...(expectedAttempt?.contentVersion ? { completedContentVersion: expectedAttempt.contentVersion, completedStepVersions: expectedAttempt.stepVersions } : {}),
      },
    }
    const writeCalendar = prepareStudyCalendarWrite(now)
    if (!writeCalendar) return false
    if (!runLearningStorageTransaction(() =>
      writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: currentResult.raw }) && writeCalendar()
    )) return false
    setLessons(next)
    return true
  }, [setLessons])

  const restartLesson = useCallback((lessonId: string) => {
    const stored = readLessonProgressMapResult()
    if (!stored.ok || !stored.value[lessonId]) return false
    const next = { ...stored.value, [lessonId]: restartLessonAttempt(stored.value[lessonId], generateSafeId(), Date.now()) }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: stored.raw })) return false
    setLessons(next)
    return true
  }, [setLessons])

  const resumeLessonUpdates = useCallback((lesson: Lesson, consolidation = false) => {
    const stored = readLessonProgressMapResult()
    const current = stored.value[lesson.id]
    if (!stored.ok || !current) return false
    const resume = consolidation ? resumeLessonConsolidationAttempt : resumeLessonUpdateAttempt
    const updated = resume(current, lesson, generateSafeId(), Date.now())
    if (!updated) return false
    const next = { ...stored.value, [lesson.id]: updated }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: stored.raw })) return false
    setLessons(next)
    return true
  }, [setLessons])

  const saveLessonPosition = useCallback((lessonId: string, currentStepIndex: number, lastStepId?: string, expectedAttempt?: { attemptId?: string }) => {
    const currentResult = readLessonProgressMapResult()
    if (!currentResult.ok) return false
    const base = currentResult.value
    const current = base[lessonId]
    if (!current) return false
    if (expectedAttempt && current.attemptId !== expectedAttempt.attemptId) return false
    const now = Date.now()
    const next = {
      ...base,
      [lessonId]: {
        ...current,
        currentStepIndex: normalizeStepIndex(currentStepIndex),
        lastStepId: lastStepId || current.lastStepId,
        updatedAt: now,
      },
    }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: currentResult.raw })) return false
    setLessons(next)
    return true
  }, [setLessons])

  const saveLessonStepAnswer = useCallback((lessonId: string, stepId: string, answer: LessonStepAnswer) => {
    const currentResult = readLessonProgressMapResult()
    if (!currentResult.ok) return false
    const next = applyLessonStepAnswer(currentResult.value, lessonId, stepId, answer, Date.now())
    if (!next) return false
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: currentResult.raw })) return false
    queueLearningNotification(() => setLessons(next))
    return true
  }, [setLessons])

  const revealLessonHint = useCallback((lessonId: string, stepId: string, attemptId?: string) => {
    const stored = readLessonProgressMapResult()
    const current = stored.value[lessonId]
    if (!stored.ok || !current || current.attemptId !== attemptId) return false
    const hintedStepIds = [...new Set([...(current.hintedStepIds ?? []), stepId])]
    const next = { ...stored.value, [lessonId]: { ...current, hintedStepIds } }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: stored.raw })) return false
    setLessons(next)
    return true
  }, [setLessons])

  return {
    ...learning,
    startLesson,
    completeLesson,
    restartLesson,
    resumeLessonUpdates,
    saveLessonPosition,
    saveLessonStepAnswer,
    revealLessonHint,
  }
}
