import type { LessonStep } from "@/data/lessons"
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
