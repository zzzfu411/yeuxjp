import type { Lesson, LessonStep } from "@/data/lessons"
import type { LessonProgressMap, PracticeResult } from "@/lib/learning-progress-model"
import type { Question } from "@/lib/questions"

export type LessonPracticeStep = Extract<LessonStep, { itemId: string }>

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

export function countPracticeSteps(steps: LessonStep[]) {
  return steps.filter((step): step is LessonPracticeStep => "itemId" in step).length
}

export function calculateLessonCompletionScore(correct: number, practiceSteps: number) {
  return practiceSteps ? Math.round((correct / practiceSteps) * 100) : 100
}

export function countCorrectLessonAnswers(answered: Record<string, boolean>) {
  return Object.values(answered).filter(Boolean).length
}

export function calculateLessonStepProgress(stepIndex: number, stepCount: number) {
  if (!Number.isFinite(stepCount) || stepCount <= 0) return 0
  return ((clampLessonStepIndex(stepIndex, stepCount) + 1) / Math.floor(stepCount)) * 100
}

export function getLessonCoursePosition(courseLessons: readonly Pick<Lesson, "id">[], lessonId: string) {
  const index = courseLessons.findIndex((item) => item.id === lessonId)
  return index >= 0 ? index + 1 : 0
}

export function getNextCourseLesson<T extends Pick<Lesson, "id">>(courseLessons: readonly T[], lessonId: string): T | null {
  const index = courseLessons.findIndex((item) => item.id === lessonId)
  if (index < 0) return null
  return courseLessons[index + 1] ?? null
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
}: {
  lesson: Lesson
  courseLessons: readonly Lesson[]
  lessons: LessonProgressMap
  stepIndex: number
  answered: Record<string, boolean>
  practiceSteps: number
  loaded: boolean
  lessonUnlocked: boolean
}) {
  const correctCount = countCorrectLessonAnswers(answered)

  return {
    lessonPosition: getLessonCoursePosition(courseLessons, lesson.id),
    nextLesson: getNextCourseLesson(courseLessons, lesson.id),
    stepProgress: calculateLessonStepProgress(stepIndex, lesson.steps.length),
    correctCount,
    completionScore: calculateLessonCompletionScore(correctCount, practiceSteps),
    lessonReadOnly: isLessonReadOnly(loaded, lessonUnlocked),
    hasCompletedLesson: isLessonCompleted(lessons, lesson.id),
  }
}

export function getLessonAnsweredFromResults(lessonId: string, steps: LessonStep[], results: PracticeResult[]) {
  const practiceStepIds = new Set(countPracticeSteps(steps) ? steps.filter((step) => "itemId" in step).map((step) => step.id) : [])
  const answered: Record<string, boolean> = {}

  for (const result of results) {
    if (result.lessonId !== lessonId) continue
    if (!result.lessonStepId || !practiceStepIds.has(result.lessonStepId)) continue
    answered[result.lessonStepId] = result.correct
  }

  return answered
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
