import { normalizeKanaPracticeRecord, normalizeKanaPracticeResultItemId } from "@/lib/kana-id"
import { normalizeLessonStepAnswerMap } from "@/lib/lesson-step-answers"
import { normalizeAssessmentEvidence, updateAssessmentEvidence, getRecordedAssessmentModes } from "@/lib/assessment-evidence"
import { isSafeRecordKey } from "@/lib/safe-id"
export { getAssessedModes, averageMastery } from "@/lib/assessment-evidence"
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
    ...(["N5", "N4", "N3", "N2"].includes(obj.jlptTarget ?? "") ? { jlptTarget: obj.jlptTarget } : {}),
    ...(["unknown", "N5", "N4", "N3", "N2"].includes(obj.selfAssessedLevel ?? "") ? { selfAssessedLevel: obj.selfAssessedLevel } : {}),
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
    if (!isSafeRecordKey(lessonId) || !value || typeof value !== "object") continue
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
    if (typeof obj.completedContentVersion === "string") normalized.completedContentVersion = obj.completedContentVersion
    if (obj.completedStepVersions && typeof obj.completedStepVersions === "object" && !Array.isArray(obj.completedStepVersions)) {
      normalized.completedStepVersions = Object.fromEntries(Object.entries(obj.completedStepVersions).filter(([, value]) => typeof value === "string"))
    }
    if (Array.isArray(obj.updateStepIds)) normalized.updateStepIds = [...new Set(obj.updateStepIds.filter(id => typeof id === "string"))]
    const superseded = normalizeLessonStepAnswerMap(obj.supersededAnswers)
    if (superseded) normalized.supersededAnswers = superseded
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
    if (!isSafeRecordKey(itemId) || !value || typeof value !== "object") continue
    const obj = value as Partial<ItemProgress>
    const itemType = obj.itemType ?? "lesson"
    if (!isPracticeItemType(itemType)) continue
    out[itemId] = {
      itemId,
      itemType,
      ...(Array.isArray(obj.assessedModes) ? { assessedModes: [...new Set(obj.assessedModes.filter(isPracticeMode))] } : {}),
      ...(obj.assessmentEvidence ? { assessmentEvidence: normalizeAssessmentEvidence(obj.assessmentEvidence) } : {}),
      recognition: clampScore(obj.recognition ?? 0),
      listening: clampScore(obj.listening ?? 0),
      meaning: clampScore(obj.meaning ?? 0),
      recall: clampScore(obj.recall ?? 0),
      production: clampScore(obj.production ?? 0),
      ...(obj.outputEvidence && typeof obj.outputEvidence === "object" ? { outputEvidence: {
        score: clampScore(obj.outputEvidence.score), attempts: nonNegativeInteger(obj.outputEvidence.attempts),
        correct: Math.min(nonNegativeInteger(obj.outputEvidence.correct), nonNegativeInteger(obj.outputEvidence.attempts)),
      } } : {}),
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
      ...(typeof item.questionVersion === "string" ? { questionVersion: item.questionVersion } : {}),
      ...(typeof item.assessmentRevision === "string" ? { assessmentRevision: item.assessmentRevision } : {}),
      ...(item.activitySource === "review" ? { activitySource: "review" as const } : {}),
      ...(["choice", "assembly", "input"].includes(item.responseFormat ?? "") ? { responseFormat: item.responseFormat } : {}),
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
  const independent = result.mode === "production" && result.responseFormat === "input" && !result.assisted
  const outputEvidence = independent ? {
    score: clampScore((current.outputEvidence?.score ?? 0) + delta),
    attempts: (current.outputEvidence?.attempts ?? 0) + 1,
    correct: (current.outputEvidence?.correct ?? 0) + (result.correct ? 1 : 0),
  } : current.outputEvidence
  const assessmentEvidence = updateAssessmentEvidence(current, result)

  return {
    ...base,
    [itemId]: {
      ...current,
      itemType: result.itemType,
      assessedModes: [...new Set([...getRecordedAssessmentModes(current), ...(result.assisted ? [] : [result.mode])])],
      ...(assessmentEvidence ? { assessmentEvidence } : {}),
      [result.mode]: nextScore,
      ...(outputEvidence ? { outputEvidence } : {}),
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
