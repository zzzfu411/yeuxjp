export type LessonStepAnswer = {
  answer?: string
  correct: boolean
  createdAt: number
}

export type LessonStepAnswerMap = Record<string, LessonStepAnswer>

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

export function normalizeLessonStepAnswerMap(input: unknown): LessonStepAnswerMap | undefined {
  if (!input || typeof input !== "object") return undefined
  const out: LessonStepAnswerMap = {}
  for (const [stepId, value] of Object.entries(input as Record<string, unknown>)) {
    if (!stepId || !value || typeof value !== "object") continue
    const obj = value as Partial<LessonStepAnswer>
    if (typeof obj.correct !== "boolean") continue
    out[stepId] = {
      correct: obj.correct,
      createdAt: finiteNumber(obj.createdAt, 0),
      answer: typeof obj.answer === "string" ? obj.answer : undefined,
    }
  }
  return Object.keys(out).length ? out : undefined
}

export function applyLessonStepAnswer<T extends { stepAnswers?: LessonStepAnswerMap; updatedAt?: number }>(
  lessons: Record<string, T>,
  lessonId: string,
  stepId: string,
  answer: LessonStepAnswer,
  now: number
): Record<string, T> | null {
  const current = lessons[lessonId]
  if (!current || !stepId) return null
  return {
    ...lessons,
    [lessonId]: {
      ...current,
      stepAnswers: { ...current.stepAnswers, [stepId]: answer },
      updatedAt: now,
    },
  }
}

export function mergeLessonStepAnswers(
  stored: LessonStepAnswerMap | undefined,
  fromResults: LessonStepAnswerMap
): LessonStepAnswerMap {
  const merged: LessonStepAnswerMap = { ...stored }
  for (const [stepId, answer] of Object.entries(fromResults)) {
    const existing = merged[stepId]
    if (!existing || answer.createdAt >= existing.createdAt) merged[stepId] = answer
  }
  return merged
}
