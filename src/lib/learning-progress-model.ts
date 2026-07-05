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
  lessonStepId?: string
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

export type LessonProgressMap = Record<string, LessonProgress>
export type ItemProgressMap = Record<string, ItemProgress>

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
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
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
    out[lessonId] = normalized
  }
  return out
}

export function normalizeItemProgressMap(input: unknown, now = Date.now()): ItemProgressMap {
  if (!input || typeof input !== "object") return {}
  const out: ItemProgressMap = {}
  for (const [itemId, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue
    const obj = value as Partial<ItemProgress>
    const itemType = obj.itemType ?? "lesson"
    if (!isPracticeItemType(itemType)) continue
    out[itemId] = {
      itemId,
      itemType,
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

    out.push({
      lessonId: typeof item.lessonId === "string" ? item.lessonId : undefined,
      lessonStepId: typeof item.lessonStepId === "string" ? item.lessonStepId : undefined,
      itemId: item.itemId,
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
  const nextResult: PracticeResult = { ...result, createdAt: safeCreatedAt }
  return [...normalizePracticeResults(previous, safeCreatedAt), nextResult].slice(-PRACTICE_RESULT_LIMIT)
}

export function updateItemProgressForPractice(previous: unknown, result: PracticeResult) {
  const updatedAt = finiteNumber(result.createdAt, Date.now())
  const base = normalizeItemProgressMap(previous, updatedAt)
  const current = base[result.itemId] ?? createItemProgress(result.itemId, result.itemType, updatedAt)
  const delta = result.correct ? 18 : -10
  const nextScore = clampScore(current[result.mode] + delta)

  return {
    ...base,
    [result.itemId]: {
      ...current,
      itemType: result.itemType,
      [result.mode]: nextScore,
      attempts: current.attempts + 1,
      correct: current.correct + (result.correct ? 1 : 0),
      updatedAt,
    },
  } satisfies ItemProgressMap
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function buildStudyDates(lessons: LessonProgressMap, results: readonly PracticeResult[]) {
  const dates = new Set<string>()
  for (const lesson of Object.values(lessons)) {
    if (lesson.completedAt) dates.add(todayKey(new Date(lesson.completedAt)))
  }
  for (const result of results) {
    dates.add(todayKey(new Date(result.createdAt)))
  }
  return dates
}

export function calculateStudyStreak(studyDates: ReadonlySet<string>, today: Date = new Date()) {
  let count = 0
  const cursor = new Date(today)
  for (;;) {
    if (!studyDates.has(todayKey(cursor))) break
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

export function averageMastery(item?: ItemProgress) {
  if (!item) return 0
  const scores = [
    masteryScore(item.recognition),
    masteryScore(item.listening),
    masteryScore(item.meaning),
    masteryScore(item.recall),
    masteryScore(item.production),
  ]
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
}
