import { normalizeKanaPracticeRecord, normalizeKanaPracticeResultItemId } from "@/lib/kana-id"
import { normalizeLessonStepAnswerMap } from "@/lib/lesson-step-answers"
export type * from "@/lib/learning-progress-types"
import type { LearningGoal, KanaLevel, RomajiMode, UserProfile, PracticeItemType, PracticeMode, PracticeResult, ItemProgress, LessonProgress, LessonProgressMap, ItemProgressMap } from "@/lib/learning-progress-types"
const PRACTICE_RESULT_LIMIT = 300
const PRACTICE_ITEM_TYPES = new Set<PracticeItemType>(["kana", "vocab", "grammar", "sentence", "lesson"])
const PRACTICE_MODES = new Set<PracticeMode>(["recognition", "listening", "meaning", "recall", "production"])
function isPracticeItemType(value: unknown): value is PracticeItemType {
  return typeof value === "string" && PRACTICE_ITEM_TYPES.has(value as PracticeItemType)
}
function isPracticeMode(value: unknown): value is PracticeMode {
  return typeof value === "string" && PRACTICE_MODES.has(value as PracticeMode)
}
export function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function finiteNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return Number.isFinite(fallback) ? fallback : 0
}

function finiteNumberOrUndefined(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function nonNegativeInteger(value: unknown, fallback = 0) {
  return Math.max(0, Math.floor(finiteNumber(value, fallback)))
}

function masteryScore(value: unknown) {
  return typeof value === "number" ? clampScore(value) : 0
}

export function createItemProgress(itemId: string, itemType: PracticeItemType, now = Date.now()): ItemProgress {
  const updatedAt = finiteNumber(now, Date.now())
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
    updatedAt,
  }
}

export function normalizeProfile(input: unknown, now = Date.now()): UserProfile | null {
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

  return {
    goal,
    minutesPerDay,
    kanaLevel,
    romajiMode,
    createdAt: finiteNumber(obj.createdAt, now),
    updatedAt: finiteNumber(obj.updatedAt, now),
  }
}

export function normalizeLessonProgressMap(input: unknown, now = Date.now()): LessonProgressMap {
  if (!input || typeof input !== "object") return {}
  const out: LessonProgressMap = {}
  for (const [lessonId, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue
    const obj = value as Partial<LessonProgress>
    if (typeof obj.lessonId !== "string") continue
    if (obj.lessonId !== lessonId) continue
    const normalized: LessonProgress = {
      lessonId: obj.lessonId,
      status: obj.status === "completed" ? "completed" : "started",
      startedAt: finiteNumber(obj.startedAt, now),
      completedAt: finiteNumberOrUndefined(obj.completedAt),
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
    const stepAnswers = normalizeLessonStepAnswerMap(obj.stepAnswers)
    if (stepAnswers) normalized.stepAnswers = stepAnswers
    if (typeof obj.attemptId === "string" && obj.attemptId) normalized.attemptId = obj.attemptId
    if (typeof obj.attemptCompletedAt === "number" && Number.isFinite(obj.attemptCompletedAt)) normalized.attemptCompletedAt = obj.attemptCompletedAt
    if (typeof obj.attemptScore === "number") normalized.attemptScore = clampScore(obj.attemptScore)
    if (Array.isArray(obj.hintedStepIds)) normalized.hintedStepIds = [...new Set(obj.hintedStepIds.filter((id): id is string => typeof id === "string" && !!id))]
    out[lessonId] = normalized
  }
  return out
}

export function normalizeItemProgressMap(input: unknown, now = Date.now()): ItemProgressMap {
  if (!input || typeof input !== "object") return {}
  const out: ItemProgressMap = {}
  const normalizedInput = normalizeKanaPracticeRecord(input as Record<string, unknown>)
  for (const [itemId, value] of Object.entries(normalizedInput)) {
    if (!value || typeof value !== "object") continue
    const obj = value as Partial<ItemProgress>
    const itemType = obj.itemType ?? "lesson"
    if (!isPracticeItemType(itemType)) continue
    out[itemId] = {
      itemId,
      itemType,
      ...(Array.isArray(obj.assessedModes) ? { assessedModes: [...new Set(obj.assessedModes.filter(isPracticeMode))] } : {}),
      recognition: clampScore(obj.recognition ?? 0),
      listening: clampScore(obj.listening ?? 0),
      meaning: clampScore(obj.meaning ?? 0),
      recall: clampScore(obj.recall ?? 0),
      production: clampScore(obj.production ?? 0),
      attempts: nonNegativeInteger(obj.attempts),
      correct: nonNegativeInteger(obj.correct),
      updatedAt: finiteNumber(obj.updatedAt, now),
    }
  }
  return out
}

export function normalizePracticeResults(input: unknown, now = Date.now()): PracticeResult[] {
  if (!Array.isArray(input)) return []
  const out: PracticeResult[] = []

  for (const value of input) {
    if (!value || typeof value !== "object") continue
    const item = value as Partial<PracticeResult>
    if (typeof item.itemId !== "string") continue
    if (!isPracticeMode(item.mode)) continue
    if (item.itemType !== undefined && !isPracticeItemType(item.itemType)) continue
    if (typeof item.correct !== "boolean") continue

    const itemId = normalizeKanaPracticeResultItemId(item)
    if (!itemId) continue

    out.push({
      lessonId: typeof item.lessonId === "string" ? item.lessonId : undefined,
      lessonStepId: typeof item.lessonStepId === "string" ? item.lessonStepId : undefined,
      ...(typeof item.lessonAttemptId === "string" ? { lessonAttemptId: item.lessonAttemptId } : {}),
      ...(item.assisted === true ? { assisted: true } : {}),
      itemId,
      itemType: item.itemType ?? "lesson",
      mode: item.mode,
      correct: item.correct,
      answer: typeof item.answer === "string" ? item.answer : undefined,
      durationMs: finiteNumberOrUndefined(item.durationMs),
      createdAt: finiteNumber(item.createdAt, now),
    })
  }

  return out.slice(-PRACTICE_RESULT_LIMIT)
}

export function appendPracticeResult(previous: unknown, result: Omit<PracticeResult, "createdAt">, createdAt = Date.now()) {
  const safeCreatedAt = finiteNumber(createdAt, Date.now())
  const itemId = normalizeKanaPracticeResultItemId(result) ?? result.itemId
  const nextResult: PracticeResult = { ...result, itemId, createdAt: safeCreatedAt }
  return [...normalizePracticeResults(previous, safeCreatedAt), nextResult].slice(-PRACTICE_RESULT_LIMIT)
}

export function updateItemProgressForPractice(previous: unknown, result: PracticeResult) {
  const updatedAt = finiteNumber(result.createdAt, Date.now())
  const base = normalizeItemProgressMap(previous, updatedAt)
  const itemId = normalizeKanaPracticeResultItemId(result) ?? result.itemId
  const current = base[itemId] ?? createItemProgress(itemId, result.itemType, updatedAt)
  const delta = result.assisted ? 0 : result.correct ? 18 : -10
  const nextScore = clampScore(current[result.mode] + delta)

  return {
    ...base,
    [itemId]: {
      ...current,
      itemType: result.itemType,
      assessedModes: [...new Set([...getAssessedModes(current), ...(result.assisted ? [] : [result.mode])])],
      [result.mode]: nextScore,
      attempts: current.attempts + 1,
      correct: current.correct + (result.correct && !result.assisted ? 1 : 0),
      updatedAt,
    },
  } satisfies ItemProgressMap
}

export function todayKey(date = new Date()) {
  if (!Number.isFinite(date.getTime())) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function timestampTodayKey(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  const key = todayKey(new Date(value))
  return key || null
}

export function buildStudyDates(lessons: LessonProgressMap, results: readonly PracticeResult[]) {
  const dates = new Set<string>()
  for (const lesson of Object.values(lessons)) {
    const key = timestampTodayKey(lesson.completedAt)
    if (key) dates.add(key)
  }
  for (const result of results) {
    const key = timestampTodayKey(result.createdAt)
    if (key) dates.add(key)
  }
  return dates
}

export function calculateStudyStreak(studyDates: ReadonlySet<string>, today: Date = new Date()) {
  if (!Number.isFinite(today.getTime())) return 0
  let count = 0
  const cursor = new Date(today)
  // A streak remains active through today until the learner misses a whole day.
  if (!studyDates.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  for (;;) {
    const key = todayKey(cursor)
    if (!key || !studyDates.has(key)) break
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export function mergeLessonProgressMaps(stored: LessonProgressMap, current: LessonProgressMap) {
  return { ...stored, ...current }
}

export function normalizeStepIndex(stepIndex: number) {
  if (!Number.isFinite(stepIndex)) return 0
  return Math.max(0, Math.floor(stepIndex))
}

export function getAssessedModes(item: ItemProgress): PracticeMode[] {
  return Array.isArray(item.assessedModes)
    ? [...new Set(item.assessedModes.filter(isPracticeMode))]
    : [...PRACTICE_MODES].filter(mode => Number.isFinite(item[mode]) && item[mode] > 0)
}

export function averageMastery(item?: ItemProgress) {
  if (!item) return 0
  const scores = getAssessedModes(item).map(mode => masteryScore(item[mode]))
  if (!scores.length) return 0
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
}
