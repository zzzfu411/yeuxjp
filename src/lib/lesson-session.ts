import type { Lesson, LessonStep } from "@/data/lessons"
import type { KanaLevel, LessonProgressMap, PracticeResult } from "@/lib/learning-progress-model"
import { getNextCourseLesson as getNextUnsatisfiedCourseLesson } from "@/lib/lesson-skip"
import { makeQuestionResult, type Question, type QuestionResult } from "@/lib/questions"
import type { LessonStepAnswer, LessonStepAnswerMap } from "@/lib/lesson-step-answers"

export type LessonPracticeStep = Extract<LessonStep, { itemId: string }>
export type PersistedLessonStepAnswer = LessonStepAnswer
export type PersistedLessonStepAnswerMap = LessonStepAnswerMap

export function lessonStepToQuestion(step: LessonPracticeStep): Question {
  if (step.type === "multipleChoice") {
    return {
      type: `lesson:${step.type}`,
      itemId: step.itemId,
      itemType: step.itemType,
      mode: step.mode,
      questionText: step.prompt,
      questionAudio: step.audioText,
      correctAnswer: step.answer,
      acceptedAnswers: step.acceptedAnswers,
      explanation: step.explanation,
      options: step.options.map((option) => ({ value: option, display: option })),
    }
  }

  if (step.type === "typing" || step.type === "dictation") {
    return {
      type: `lesson:${step.type}`,
      itemId: step.itemId,
      itemType: step.itemType,
      mode: step.mode,
      questionText: step.prompt,
      questionAudio: step.audioText,
      correctAnswer: step.answer,
      acceptedAnswers: step.acceptedAnswers,
      options: [{ value: step.answer, display: step.answer }],
    }
  }

  return {
    type: "lesson:sentenceBuild",
    itemId: step.itemId,
    itemType: step.itemType,
    mode: step.mode,
    questionText: step.prompt,
    correctAnswer: step.answer,
    options: [{ value: step.answer, display: step.answer }],
  }
}

export function resolveLessonStepSubmission(
  step: LessonPracticeStep,
  answer: string,
  persisted?: PersistedLessonStepAnswer
): { result: QuestionResult; shouldRecord: boolean } {
  const question = lessonStepToQuestion(step)
  if (!persisted) {
    return { result: makeQuestionResult(question, answer), shouldRecord: true }
  }

  return {
    result: {
      question,
      selectedAnswer: persisted.answer ?? answer,
      correct: persisted.correct,
      answeredAt: finiteNumber(persisted.createdAt, 0),
    },
    shouldRecord: false,
  }
}

export function countPracticeSteps(steps: LessonStep[]) {
  return steps.filter((step): step is LessonPracticeStep => "itemId" in step).length
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function nonNegativeInteger(value: unknown) {
  return Math.max(0, Math.floor(finiteNumber(value, 0)))
}

export function calculateLessonCompletionScore(correct: number, practiceSteps: number) {
  const total = nonNegativeInteger(practiceSteps)
  if (total <= 0) return 100
  const correctCount = Math.min(nonNegativeInteger(correct), total)
  return Math.round((correctCount / total) * 100)
}

export function countCorrectLessonAnswers(answered: Record<string, boolean>) {
  return Object.values(answered).filter((value) => value === true).length
}

export function calculateLessonStepProgress(stepIndex: number, stepCount: number) {
  if (!Number.isFinite(stepCount) || stepCount <= 0) return 0
  return ((clampLessonStepIndex(stepIndex, stepCount) + 1) / Math.floor(stepCount)) * 100
}

export function getLessonCoursePosition(courseLessons: readonly Pick<Lesson, "id">[], lessonId: string) {
  const index = courseLessons.findIndex((item) => item.id === lessonId)
  return index >= 0 ? index + 1 : 0
}

export function isLessonReadOnly(loaded: boolean, lessonUnlocked: boolean) {
  return !loaded || !lessonUnlocked
}

export function isLessonCompleted(lessons: LessonProgressMap, lessonId: string) {
  return lessons[lessonId]?.status === "completed"
}

export function buildLessonRunnerViewModel({
  lesson,
  courseLessons,
  lessons,
  stepIndex,
  answered,
  practiceSteps,
  loaded,
  lessonUnlocked,
  completedLessonIds,
  kanaLevel,
}: {
  lesson: Lesson
  courseLessons: readonly Lesson[]
  lessons: LessonProgressMap
  stepIndex: number
  answered: Record<string, boolean>
  practiceSteps: number
  loaded: boolean
  lessonUnlocked: boolean
  completedLessonIds?: ReadonlySet<string>
  kanaLevel?: KanaLevel | null
}) {
  const correctCount = countCorrectLessonAnswers(answered)
  const satisfiedLessonIds = new Set(completedLessonIds)
  satisfiedLessonIds.add(lesson.id)

  return {
    lessonPosition: getLessonCoursePosition(courseLessons, lesson.id),
    nextLesson: getNextUnsatisfiedCourseLesson(courseLessons, satisfiedLessonIds, kanaLevel),
    stepProgress: calculateLessonStepProgress(stepIndex, lesson.steps.length),
    correctCount,
    completionScore: calculateLessonCompletionScore(correctCount, practiceSteps),
    lessonReadOnly: isLessonReadOnly(loaded, lessonUnlocked),
    hasCompletedLesson: isLessonCompleted(lessons, lesson.id),
  }
}

export function getLatestLessonStepAnswers(
  lessonId: string,
  steps: readonly LessonStep[],
  results: readonly PracticeResult[]
): PersistedLessonStepAnswerMap {
  const practiceStepIds = new Set(steps.filter((step): step is LessonPracticeStep => "itemId" in step).map((step) => step.id))
  const latestByStep = new Map<string, PersistedLessonStepAnswer>()

  for (const result of results) {
    if (result.lessonId !== lessonId) continue
    if (!result.lessonStepId || !practiceStepIds.has(result.lessonStepId)) continue
    const createdAt = finiteNumber(result.createdAt, 0)
    const existing = latestByStep.get(result.lessonStepId)
    if (existing && createdAt < existing.createdAt) {
      continue
    }
    latestByStep.set(result.lessonStepId, {
      answer: typeof result.answer === "string" ? result.answer : undefined,
      correct: result.correct,
      createdAt,
    })
  }

  return Object.fromEntries(latestByStep)
}

export function getLessonAnsweredFromStepMap(answers: PersistedLessonStepAnswerMap) {
  const answered: Record<string, boolean> = {}
  for (const [stepId, result] of Object.entries(answers)) {
    answered[stepId] = result.correct
  }
  return answered
}

export function getLessonAnsweredFromResults(
  lessonId: string,
  steps: readonly LessonStep[],
  results: readonly PracticeResult[]
) {
  return getLessonAnsweredFromStepMap(getLatestLessonStepAnswers(lessonId, steps, results))
}

export interface LessonResumeProgress {
  status?: "started" | "completed"
  currentStepIndex?: number
  lastStepId?: string
}

export function clampLessonStepIndex(stepIndex: unknown, stepCount: number) {
  if (!Number.isFinite(stepCount) || stepCount <= 0) return 0
  const maxIndex = Math.max(0, Math.floor(stepCount) - 1)
  if (typeof stepIndex !== "number" || !Number.isFinite(stepIndex)) return 0
  return Math.max(0, Math.min(maxIndex, Math.floor(stepIndex)))
}

export function resolveLessonResumeStepIndex(progress: LessonResumeProgress | undefined, steps: readonly Pick<LessonStep, "id">[]) {
  if (!progress) return 0

  if (progress.status === "completed") return clampLessonStepIndex(steps.length - 1, steps.length)

  if (progress.lastStepId) {
    const stepIndex = steps.findIndex((step) => step.id === progress.lastStepId)
    if (stepIndex >= 0) return stepIndex
  }

  if (progress.status !== "started") return 0

  return clampLessonStepIndex(progress.currentStepIndex, steps.length)
}
