"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { LEARNING_EVENT, readLearningJson, writeLearningJson } from "@/lib/learning-storage"
import {
  clampScore,
  appendPracticeResult,
  mergeLessonProgressMaps,
  normalizeItemProgressMap,
  normalizeLessonProgressMap,
  normalizePracticeResults,
  normalizeProfile,
  normalizeStepIndex,
  todayKey,
  updateItemProgressForPractice,
  type ItemProgressMap,
  type LessonProgressMap,
  type PracticeResult,
  type UserProfile,
} from "@/lib/learning-progress-model"
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

function mergeLessonProgressState(prev: LessonProgressMap) {
  return mergeLessonProgressMaps(readLessonProgressMap(), prev)
}

export function useLearningProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setProfileState(normalizeProfile(readLearningJson(STORAGE_KEYS.USER_PROFILE, null)))
    })

    const sync = (event: Event) => {
      const detail = (event as CustomEvent).detail as { key?: string } | undefined
      if (detail?.key !== STORAGE_KEYS.USER_PROFILE) return
      setProfileState(normalizeProfile(readLearningJson(STORAGE_KEYS.USER_PROFILE, null)))
    }

    const syncStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(STORAGE_KEYS.USER_PROFILE)) return
      setProfileState(normalizeProfile(readLearningJson(STORAGE_KEYS.USER_PROFILE, null)))
    }

    window.addEventListener(LEARNING_EVENT, sync)
    window.addEventListener(LEARNING_STORE_EVENT, syncStore)
    return () => {
      cancelled = true
      window.removeEventListener(LEARNING_EVENT, sync)
      window.removeEventListener(LEARNING_STORE_EVENT, syncStore)
    }
  }, [])

  const saveProfile = useCallback((input: Omit<UserProfile, "createdAt" | "updatedAt">) => {
    const now = Date.now()
    const next: UserProfile = {
      ...input,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    }
    if (writeLearningJson(STORAGE_KEYS.USER_PROFILE, next)) setProfileState(next)
  }, [profile?.createdAt])

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
      if (
        detail?.key === STORAGE_KEYS.LESSON_PROGRESS ||
        detail?.key === STORAGE_KEYS.ITEM_PROGRESS ||
        detail?.key === STORAGE_KEYS.PRACTICE_RESULTS
      ) {
        load()
      }
    }

    const syncStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      const keys = detail?.keys ?? []
      if (
        keys.includes(STORAGE_KEYS.LESSON_PROGRESS) ||
        keys.includes(STORAGE_KEYS.ITEM_PROGRESS) ||
        keys.includes(STORAGE_KEYS.PRACTICE_RESULTS)
      ) {
        load()
      }
    }

    window.addEventListener(LEARNING_EVENT, sync)
    window.addEventListener(LEARNING_STORE_EVENT, syncStore)
    return () => {
      cancelled = true
      window.removeEventListener(LEARNING_EVENT, sync)
      window.removeEventListener(LEARNING_STORE_EVENT, syncStore)
    }
  }, [load])

  const startLesson = useCallback((lessonId: string) => {
    setLessons((prev) => {
      const base = mergeLessonProgressState(prev)
      if (base[lessonId]) return base
      const now = Date.now()
      const next = { ...base, [lessonId]: { lessonId, status: "started" as const, startedAt: now, updatedAt: now } }
      writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next)
      return next
    })
  }, [])

  const completeLesson = useCallback((lessonId: string, score?: number) => {
    setLessons((prev) => {
      const base = mergeLessonProgressState(prev)
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
      writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next)
      return next
    })
  }, [])

  const saveLessonPosition = useCallback((lessonId: string, currentStepIndex: number, lastStepId?: string) => {
    setLessons((prev) => {
      const base = mergeLessonProgressState(prev)
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
      writeLearningJson(STORAGE_KEYS.LESSON_PROGRESS, next)
      return next
    })
  }, [])

  const recordPractice = useCallback((result: Omit<PracticeResult, "createdAt">) => {
    const createdAt = Date.now()
    const nextResults = appendPracticeResult(readLearningJson(STORAGE_KEYS.PRACTICE_RESULTS, []), result, createdAt)
    const nextResult = nextResults.at(-1)
    if (!nextResult) return

    if (writeLearningJson(STORAGE_KEYS.PRACTICE_RESULTS, nextResults)) {
      setResults(nextResults)
    }

    const nextItems = updateItemProgressForPractice(readLearningJson(STORAGE_KEYS.ITEM_PROGRESS, {}), nextResult)
    if (writeLearningJson(STORAGE_KEYS.ITEM_PROGRESS, nextItems)) {
      setItems(nextItems)
    }
  }, [])

  const completedLessonIds = useMemo(() => {
    return new Set(Object.values(lessons).filter((item) => item.status === "completed").map((item) => item.lessonId))
  }, [lessons])

  const studyDates = useMemo(() => {
    const dates = new Set<string>()
    for (const lesson of Object.values(lessons)) {
      if (lesson.completedAt) dates.add(todayKey(new Date(lesson.completedAt)))
    }
    for (const result of results) {
      dates.add(todayKey(new Date(result.createdAt)))
    }
    return dates
  }, [lessons, results])

  const streak = useMemo(() => {
    let count = 0
    const cursor = new Date()
    for (;;) {
      if (!studyDates.has(todayKey(cursor))) break
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
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
