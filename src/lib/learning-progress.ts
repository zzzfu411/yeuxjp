"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { LEARNING_EVENT, readLearningJson, writeLearningJson } from "@/lib/learning-storage"
import {
  clampScore,
  appendPracticeResult,
  buildStudyDates,
  calculateStudyStreak,
  normalizeItemProgressMap,
  normalizeLessonProgressMap,
  normalizePracticeResults,
  normalizeProfile,
  normalizeStepIndex,
  updateItemProgressForPractice,
  type ItemProgressMap,
  type LessonProgressMap,
  type PracticeResult,
  type UserProfile,
} from "@/lib/learning-progress-model"
import { includesProgressStorageKey, isProfileStorageKey, isProgressStorageKey } from "@/lib/learning-progress-keys"
import { STORAGE_KEYS } from "@/lib/storage-keys"

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

function readLessonProgressMap() {
  return normalizeLessonProgressMap(readLearningJson(STORAGE_KEYS.LESSON_PROGRESS, {}))
}

function readUserProfile() {
  return normalizeProfile(readLearningJson(STORAGE_KEYS.USER_PROFILE, null))
}

export function useLearningProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setProfileState(readUserProfile())
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
    const current = readUserProfile()
    const next: UserProfile = {
      ...input,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    }
    if (!writeLearningJson(STORAGE_KEYS.USER_PROFILE, next)) return false
    setProfileState(next)
    return true
  }, [])

  return { profile, saveProfile }
}

export function useLearningProgress() {
  const [lessons, setLessons] = useState<LessonProgressMap>({})
  const [items, setItems] = useState<ItemProgressMap>({})
  const [results, setResults] = useState<PracticeResult[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(() => {
    setLessons(normalizeLessonProgressMap(readLearningJson(STORAGE_KEYS.LESSON_PROGRESS, {})))
    setItems(normalizeItemProgressMap(readLearningJson(STORAGE_KEYS.ITEM_PROGRESS, {})))
    setResults(normalizePracticeResults(readLearningJson(STORAGE_KEYS.PRACTICE_RESULTS, [])))
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
    const base = readLessonProgressMap()
    if (base[lessonId]) return true
    const now = Date.now()
    const next = { ...base, [lessonId]: { lessonId, status: "started" as const, startedAt: now, updatedAt: now } }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next)) return false
    setLessons(next)
    return true
  }, [])

  const completeLesson = useCallback((lessonId: string, score?: number) => {
    const base = readLessonProgressMap()
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
        updatedAt: now,
      },
    }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next)) return false
    setLessons(next)
    return true
  }, [])

  const saveLessonPosition = useCallback((lessonId: string, currentStepIndex: number, lastStepId?: string) => {
    const base = readLessonProgressMap()
    const current = base[lessonId]
    const now = Date.now()
    const next = {
      ...base,
      [lessonId]: {
        lessonId,
        status: current?.status ?? ("started" as const),
        startedAt: current?.startedAt ?? now,
        completedAt: current?.completedAt,
        score: current?.score,
        currentStepIndex: normalizeStepIndex(currentStepIndex),
        lastStepId: lastStepId || current?.lastStepId,
        updatedAt: now,
      },
    }
    if (!writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next)) return false
    setLessons(next)
    return true
  }, [])

  const recordPractice = useCallback((result: Omit<PracticeResult, "createdAt">) => {
    const createdAt = Date.now()
    const previousResults = normalizePracticeResults(readLearningJson(STORAGE_KEYS.PRACTICE_RESULTS, []))
    const previousItems = normalizeItemProgressMap(readLearningJson(STORAGE_KEYS.ITEM_PROGRESS, {}))
    const nextResults = appendPracticeResult(previousResults, result, createdAt)
    const nextResult = nextResults.at(-1)
    if (!nextResult) return false

    const nextItems = updateItemProgressForPractice(previousItems, nextResult)

    if (!writeLearningJson(STORAGE_KEYS.PRACTICE_RESULTS, nextResults)) {
      return false
    }

    if (!writeLearningJson(STORAGE_KEYS.ITEM_PROGRESS, nextItems)) {
      writeLearningJson(STORAGE_KEYS.PRACTICE_RESULTS, previousResults)
      return false
    }

    setResults(nextResults)
    setItems(nextItems)
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
    recordPractice,
  }
}
