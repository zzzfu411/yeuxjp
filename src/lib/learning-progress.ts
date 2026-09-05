"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT, queueLearningNotification, runLearningStorageTransaction } from "@/lib/learning-store"
import { LEARNING_EVENT, writeLearningJson } from "@/lib/learning-storage"
import {
  clampScore,
  appendPracticeResult,
  calculateStudyStreak,
  normalizeStepIndex,
  updateItemProgressForPractice,
  type ItemProgressMap,
  type LessonProgressMap,
  type PracticeResult,
} from "@/lib/learning-progress-model"
import { applyLessonStepAnswer, type LessonStepAnswer } from "@/lib/lesson-step-answers"
import { includesProgressStorageKey, isProgressStorageKey } from "@/lib/learning-progress-keys"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { finishLessonAttempt, restartLessonAttempt, isLessonAttemptComplete } from "@/lib/lesson-attempt"
import {
  readItemProgressMapResult,
  readLessonProgressMapResult,
  readPracticeResultsResult,
} from "@/lib/learning-progress-storage"

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

import { readStudyCalendarResult, prepareStudyCalendarWrite } from "@/lib/study-calendar-storage"
import { calendarStudyDates, mergeLegacyStudyCalendar, type StudyCalendar } from "@/lib/study-calendar-model"
import { useLocalDay } from "@/lib/use-local-day"

export function useLearningProgress() {
  const [calendar, setCalendar] = useState<StudyCalendar>({})
  const currentLocalDay = useLocalDay()
  const [lessons, setLessons] = useState<LessonProgressMap>({})
  const [items, setItems] = useState<ItemProgressMap>({})
  const [results, setResults] = useState<PracticeResult[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(() => {
    setCalendar(readStudyCalendarResult().value)
    setLessons(readLessonProgressMapResult().value)
    setItems(readItemProgressMapResult().value)
    setResults(readPracticeResultsResult().value)
    setLoaded(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) load()
    })

    const sync = (event: Event) => {
      const detail = (event as CustomEvent).detail as { key?: string } | undefined
      if (isProgressStorageKey(detail?.key)) {
        load()
      }
    }

    const syncStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (includesProgressStorageKey(detail?.keys)) {
        load()
      }
    }

    const onStorage = (event: StorageEvent) => {
      if (isProgressStorageKey(event.key)) {
        load()
      }
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(LEARNING_EVENT, sync)
    window.addEventListener(LEARNING_STORE_EVENT, syncStore)
    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(LEARNING_EVENT, sync)
      window.removeEventListener(LEARNING_STORE_EVENT, syncStore)
    }
  }, [load])

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
  }, [])

  const completeLesson = useCallback((lessonId: string, score?: number, expectedAttempt?: { attemptId?: string }) => {
    const currentResult = readLessonProgressMapResult()
    if (!currentResult.ok) return false
    const base = currentResult.value
    const current = base[lessonId]
    if (expectedAttempt && (!current || current.attemptId !== expectedAttempt.attemptId)) return false
    if (isLessonAttemptComplete(current)) return true
    const now = Date.now()
    const next = {
      ...base,
      [lessonId]: finishLessonAttempt(lessonId, current, typeof score === "number" ? clampScore(score) : undefined, now),
    }
    const writeCalendar = prepareStudyCalendarWrite(now)
    if (!writeCalendar) return false
    if (!runLearningStorageTransaction(() =>
      writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: currentResult.raw }) && writeCalendar()
    )) return false
    setLessons(next)
    return true
  }, [])

  const restartLesson = useCallback((lessonId: string) => {
    const stored = readLessonProgressMapResult()
    if (!stored.ok || !stored.value[lessonId]) return false
    const next = { ...stored.value, [lessonId]: restartLessonAttempt(stored.value[lessonId], crypto.randomUUID(), Date.now()) }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: stored.raw })) return false
    setLessons(next)
    return true
  }, [])

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
  }, [])

  const saveLessonStepAnswer = useCallback((lessonId: string, stepId: string, answer: LessonStepAnswer) => {
    const currentResult = readLessonProgressMapResult()
    if (!currentResult.ok) return false
    const next = applyLessonStepAnswer(currentResult.value, lessonId, stepId, answer, Date.now())
    if (!next) return false
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: currentResult.raw })) return false
    queueLearningNotification(() => setLessons(next))
    return true
  }, [])

  const revealLessonHint = useCallback((lessonId: string, stepId: string, attemptId?: string) => {
    const stored = readLessonProgressMapResult()
    const current = stored.value[lessonId]
    if (!stored.ok || !current || current.attemptId !== attemptId) return false
    const hintedStepIds = [...new Set([...(current.hintedStepIds ?? []), stepId])]
    const next = { ...stored.value, [lessonId]: { ...current, hintedStepIds } }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: stored.raw })) return false
    setLessons(next)
    return true
  }, [])

  const recordPractice = useCallback((result: Omit<PracticeResult, "createdAt">) => {
    const createdAt = Date.now()
    const previousResultsResult = readPracticeResultsResult()
    const previousItemsResult = readItemProgressMapResult()
    if (!previousResultsResult.ok || !previousItemsResult.ok) return false
    const previousResults = previousResultsResult.value
    const previousItems = previousItemsResult.value
    const nextResults = appendPracticeResult(previousResults, result, createdAt)
    const nextResult = nextResults.at(-1)
    if (!nextResult) return false

    const nextItems = updateItemProgressForPractice(previousItems, nextResult)
    const writeCalendar = prepareStudyCalendarWrite(nextResult)
    if (!writeCalendar) return false

    const saved = runLearningStorageTransaction(() => {
      const wrote = writeLearningJson(
        STORAGE_KEYS.PRACTICE_RESULTS,
        nextResults,
        { expectedRaw: previousResultsResult.raw }
      ) && writeLearningJson(
        STORAGE_KEYS.ITEM_PROGRESS,
        nextItems,
        { expectedRaw: previousItemsResult.raw }
      ) && writeCalendar()
      if (wrote) {
        queueLearningNotification(() => {
          setResults(nextResults)
          setItems(nextItems)
        })
      }
      return wrote
    })
    if (!saved) return false

    return true
  }, [])

  const completedLessonIds = useMemo(() => {
    return new Set(Object.values(lessons).filter((item) => item.status === "completed").map((item) => item.lessonId))
  }, [lessons])

  const studyCalendar = useMemo(() => mergeLegacyStudyCalendar(calendar, lessons, results), [calendar, lessons, results])
  const studyDates = useMemo(() => calendarStudyDates(studyCalendar), [studyCalendar])

  const streak = useMemo(() => {
    return calculateStudyStreak(studyDates, currentLocalDay)
  }, [studyDates, currentLocalDay])

  return {
    lessons,
    items,
    results,
    loaded,
    completedLessonIds,
    streak,
    studyCalendar,
    currentLocalDay,
    startLesson,
    completeLesson,
    restartLesson,
    saveLessonPosition,
    saveLessonStepAnswer,
    revealLessonHint,
    recordPractice,
  }
}
