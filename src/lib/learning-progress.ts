"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { STORAGE_KEYS } from "@/lib/storage-keys"

const LEARNING_EVENT = "yasashi:learning:update"

export type LearningGoal = "balanced" | "travel" | "jlpt" | "media"
export type KanaLevel = "none" | "some" | "solid"
export type RomajiMode = "always" | "practice" | "hidden"

export interface UserProfile {
  goal: LearningGoal
  minutesPerDay: number
  kanaLevel: KanaLevel
  romajiMode: RomajiMode
  createdAt: number
  updatedAt: number
}

export interface LessonProgress {
  lessonId: string
  status: "started" | "completed"
  startedAt: number
  completedAt?: number
  score?: number
  currentStepIndex?: number
  lastStepId?: string
  updatedAt?: number
}

export type PracticeItemType = "kana" | "vocab" | "grammar" | "sentence" | "lesson"
export type PracticeMode = "recognition" | "listening" | "meaning" | "recall" | "production"

export interface PracticeResult {
  lessonId?: string
  itemId: string
  itemType: PracticeItemType
  mode: PracticeMode
  correct: boolean
  answer?: string
  durationMs?: number
  createdAt: number
}

export interface ItemProgress {
  itemId: string
  itemType: PracticeItemType
  recognition: number
  listening: number
  meaning: number
  recall: number
  production: number
  attempts: number
  correct: number
  updatedAt: number
}

type LessonProgressMap = Record<string, LessonProgress>
type ItemProgressMap = Record<string, ItemProgress>

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[learning-progress] Failed to read ${key}:`, e)
    }
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(LEARNING_EVENT, { detail: { key } }))
    return true
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[learning-progress] Failed to write ${key}:`, e)
    }
    return false
  }
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function createItemProgress(itemId: string, itemType: PracticeItemType, now = Date.now()): ItemProgress {
  return {
    itemId,
    itemType,
    recognition: 0,
    listening: 0,
    meaning: 0,
    recall: 0,
    production: 0,
    attempts: 0,
    correct: 0,
    updatedAt: now,
  }
}

function normalizeProfile(input: unknown): UserProfile | null {
  if (!input || typeof input !== "object") return null
  const obj = input as Partial<UserProfile>
  const goal: LearningGoal =
    obj.goal === "travel" || obj.goal === "jlpt" || obj.goal === "media" || obj.goal === "balanced"
      ? obj.goal
      : "balanced"
  const kanaLevel: KanaLevel = obj.kanaLevel === "some" || obj.kanaLevel === "solid" ? obj.kanaLevel : "none"
  const romajiMode: RomajiMode =
    obj.romajiMode === "always" || obj.romajiMode === "hidden" || obj.romajiMode === "practice"
      ? obj.romajiMode
      : "practice"
  const minutesPerDay =
    typeof obj.minutesPerDay === "number" && Number.isFinite(obj.minutesPerDay)
      ? Math.max(5, Math.min(30, Math.round(obj.minutesPerDay)))
      : 10
  const now = Date.now()

  return {
    goal,
    minutesPerDay,
    kanaLevel,
    romajiMode,
    createdAt: typeof obj.createdAt === "number" ? obj.createdAt : now,
    updatedAt: typeof obj.updatedAt === "number" ? obj.updatedAt : now,
  }
}

function normalizeLessonProgressMap(input: unknown): LessonProgressMap {
  if (!input || typeof input !== "object") return {}
  const out: LessonProgressMap = {}
  for (const [lessonId, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue
    const obj = value as Partial<LessonProgress>
    if (typeof obj.lessonId !== "string") continue
    const normalized: LessonProgress = {
      lessonId: obj.lessonId,
      status: obj.status === "completed" ? "completed" : "started",
      startedAt: typeof obj.startedAt === "number" ? obj.startedAt : Date.now(),
      completedAt: typeof obj.completedAt === "number" ? obj.completedAt : undefined,
      score: typeof obj.score === "number" ? clampScore(obj.score) : undefined,
    }
    if (typeof obj.currentStepIndex === "number" && Number.isFinite(obj.currentStepIndex)) {
      normalized.currentStepIndex = Math.max(0, Math.floor(obj.currentStepIndex))
    }
    if (typeof obj.lastStepId === "string" && obj.lastStepId) {
      normalized.lastStepId = obj.lastStepId
    }
    if (typeof obj.updatedAt === "number" && Number.isFinite(obj.updatedAt)) {
      normalized.updatedAt = obj.updatedAt
    }
    out[lessonId] = normalized
  }
  return out
}

function normalizeItemProgressMap(input: unknown): ItemProgressMap {
  if (!input || typeof input !== "object") return {}
  const out: ItemProgressMap = {}
  for (const [itemId, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue
    const obj = value as Partial<ItemProgress>
    const itemType = obj.itemType ?? "lesson"
    if (!["kana", "vocab", "grammar", "sentence", "lesson"].includes(itemType)) continue
    out[itemId] = {
      itemId,
      itemType,
      recognition: clampScore(obj.recognition ?? 0),
      listening: clampScore(obj.listening ?? 0),
      meaning: clampScore(obj.meaning ?? 0),
      recall: clampScore(obj.recall ?? 0),
      production: clampScore(obj.production ?? 0),
      attempts: typeof obj.attempts === "number" ? Math.max(0, Math.floor(obj.attempts)) : 0,
      correct: typeof obj.correct === "number" ? Math.max(0, Math.floor(obj.correct)) : 0,
      updatedAt: typeof obj.updatedAt === "number" ? obj.updatedAt : Date.now(),
    }
  }
  return out
}

function normalizePracticeResults(input: unknown): PracticeResult[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Partial<PracticeResult>)
    .filter((item) => typeof item.itemId === "string" && typeof item.mode === "string" && typeof item.correct === "boolean")
    .map((item) => ({
      lessonId: typeof item.lessonId === "string" ? item.lessonId : undefined,
      itemId: item.itemId!,
      itemType: item.itemType ?? "lesson",
      mode: item.mode as PracticeMode,
      correct: item.correct!,
      answer: typeof item.answer === "string" ? item.answer : undefined,
      durationMs: typeof item.durationMs === "number" ? item.durationMs : undefined,
      createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
    }))
    .slice(-300)
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function readLessonProgressMap() {
  return normalizeLessonProgressMap(readJson(STORAGE_KEYS.LESSON_PROGRESS, {}))
}

function mergeLessonProgressState(prev: LessonProgressMap) {
  return { ...readLessonProgressMap(), ...prev }
}

function normalizeStepIndex(stepIndex: number) {
  if (!Number.isFinite(stepIndex)) return 0
  return Math.max(0, Math.floor(stepIndex))
}

export function useLearningProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setProfileState(normalizeProfile(readJson(STORAGE_KEYS.USER_PROFILE, null)))
    })

    const sync = (event: Event) => {
      const detail = (event as CustomEvent).detail as { key?: string } | undefined
      if (detail?.key !== STORAGE_KEYS.USER_PROFILE) return
      setProfileState(normalizeProfile(readJson(STORAGE_KEYS.USER_PROFILE, null)))
    }

    const syncStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(STORAGE_KEYS.USER_PROFILE)) return
      setProfileState(normalizeProfile(readJson(STORAGE_KEYS.USER_PROFILE, null)))
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
    if (writeJson(STORAGE_KEYS.USER_PROFILE, next)) setProfileState(next)
  }, [profile?.createdAt])

  return { profile, saveProfile }
}

export function useLearningProgress() {
  const [lessons, setLessons] = useState<LessonProgressMap>({})
  const [items, setItems] = useState<ItemProgressMap>({})
  const [results, setResults] = useState<PracticeResult[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(() => {
    setLessons(normalizeLessonProgressMap(readJson(STORAGE_KEYS.LESSON_PROGRESS, {})))
    setItems(normalizeItemProgressMap(readJson(STORAGE_KEYS.ITEM_PROGRESS, {})))
    setResults(normalizePracticeResults(readJson(STORAGE_KEYS.PRACTICE_RESULTS, [])))
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
      writeJson(STORAGE_KEYS.LESSON_PROGRESS, next)
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
      writeJson(STORAGE_KEYS.LESSON_PROGRESS, next)
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
      writeJson(STORAGE_KEYS.LESSON_PROGRESS, next)
      return next
    })
  }, [])

  const recordPractice = useCallback((result: Omit<PracticeResult, "createdAt">) => {
    const createdAt = Date.now()
    const nextResult: PracticeResult = { ...result, createdAt }

    setResults((prev) => {
      const next = [...prev, nextResult].slice(-300)
      writeJson(STORAGE_KEYS.PRACTICE_RESULTS, next)
      return next
    })

    setItems((prev) => {
      const current = prev[result.itemId] ?? createItemProgress(result.itemId, result.itemType, createdAt)
      const delta = result.correct ? 18 : -10
      const nextScore = clampScore(current[result.mode] + delta)
      const next: ItemProgressMap = {
        ...prev,
        [result.itemId]: {
          ...current,
          itemType: result.itemType,
          [result.mode]: nextScore,
          attempts: current.attempts + 1,
          correct: current.correct + (result.correct ? 1 : 0),
          updatedAt: createdAt,
        },
      }
      writeJson(STORAGE_KEYS.ITEM_PROGRESS, next)
      return next
    })
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

export function averageMastery(item?: ItemProgress) {
  if (!item) return 0
  return Math.round((item.recognition + item.listening + item.meaning + item.recall + item.production) / 5)
}
