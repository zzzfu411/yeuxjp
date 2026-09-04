"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT, queueLearningNotification, runLearningStorageTransaction } from "@/lib/learning-store"
import { LEARNING_EVENT, writeLearningJson } from "@/lib/learning-storage"
import {
  clampScore,
  appendPracticeResult,
  buildStudyDates,
  calculateStudyStreak,
  normalizeStepIndex,
  updateItemProgressForPractice,
  type ItemProgressMap,
  type LessonProgressMap,
  type PracticeResult,
  type UserProfile,
} from "@/lib/learning-progress-model"
import { applyLessonStepAnswer, type LessonStepAnswer } from "@/lib/lesson-step-answers"
import { includesProgressStorageKey, isProfileStorageKey, isProgressStorageKey } from "@/lib/learning-progress-keys"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import {
  readItemProgressMapResult,
  readLessonProgressMapResult,
  readPracticeResultsResult,
  readUserProfileResult,
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

function readUserProfile() {
  return readUserProfileResult().value
}

export function useLearningProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      setProfileState(readUserProfile())
      setLoaded(true)
    })

    const sync = (event: Event) => {
      const detail = (event as CustomEvent).detail as { key?: string } | undefined
      if (!isProfileStorageKey(detail?.key)) return
      setProfileState(readUserProfile())
    }

    const syncStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(STORAGE_KEYS.USER_PROFILE)) return
      setProfileState(readUserProfile())
    }

    const onStorage = (event: StorageEvent) => {
      if (!isProfileStorageKey(event.key)) return
      setProfileState(readUserProfile())
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
  }, [])

  const saveProfile = useCallback((input: Omit<UserProfile, "createdAt" | "updatedAt">) => {
    const now = Date.now()
    const currentResult = readUserProfileResult()
    if (!currentResult.ok) return false
    const current = currentResult.value
    const next: UserProfile = {
      ...input,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    }
    if (!writeLearningJson(STORAGE_KEYS.USER_PROFILE, next, { expectedRaw: currentResult.raw })) return false
    setProfileState(next)
    return true
  }, [])

  return { profile, loaded, saveProfile }
}

export function useLearningProgress() {
  const [lessons, setLessons] = useState<LessonProgressMap>({})
  const [items, setItems] = useState<ItemProgressMap>({})
  const [results, setResults] = useState<PracticeResult[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(() => {
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

  const completeLesson = useCallback((lessonId: string, score?: number) => {
    const currentResult = readLessonProgressMapResult()
    if (!currentResult.ok) return false
    const base = currentResult.value
    const current = base[lessonId]
    const now = Date.now()
    const next = {
      ...base,
      [lessonId]: {
        lessonId,
        status: "completed" as const,
        startedAt: current?.startedAt ?? now,
        completedAt: now,
        score: typeof score === "number" ? clampScore(score) : undefined,
        currentStepIndex: current?.currentStepIndex,
        lastStepId: current?.lastStepId,
        stepAnswers: current?.stepAnswers,
        updatedAt: now,
      },
    }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next, { expectedRaw: currentResult.raw })) return false
    setLessons(next)
    return true
  }, [])

  const saveLessonPosition = useCallback((lessonId: string, currentStepIndex: number, lastStepId?: string) => {
    const currentResult = readLessonProgressMapResult()
    if (!currentResult.ok) return false
    const base = currentResult.value
    const current = base[lessonId]
    if (!current) return false
    const now = Date.now()
    const next = {
      ...base,
      [lessonId]: {
        lessonId,
        status: current.status,
        startedAt: current.startedAt,
        completedAt: current.completedAt,
        score: current.score,
        currentStepIndex: normalizeStepIndex(currentStepIndex),
        lastStepId: lastStepId || current.lastStepId,
        stepAnswers: current.stepAnswers,
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

    const saved = runLearningStorageTransaction(() => {
      const wrote = writeLearningJson(
        STORAGE_KEYS.PRACTICE_RESULTS,
        nextResults,
        { expectedRaw: previousResultsResult.raw }
      ) && writeLearningJson(
        STORAGE_KEYS.ITEM_PROGRESS,
        nextItems,
        { expectedRaw: previousItemsResult.raw }
      )
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

  const studyDates = useMemo(() => {
    return buildStudyDates(lessons, results)
  }, [lessons, results])

  const streak = useMemo(() => {
    return calculateStudyStreak(studyDates)
  }, [studyDates])

  return {
    lessons,
    items,
    results,
    loaded,
    completedLessonIds,
    streak,
    startLesson,
    completeLesson,
    saveLessonPosition,
    saveLessonStepAnswer,
    recordPractice,
  }
}
