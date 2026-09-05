import type { LessonProgress } from "@/lib/learning-progress-model"

export function isLessonAttemptComplete(progress?: LessonProgress) {
  return progress?.status === "completed" && (!progress.attemptId || progress.attemptCompletedAt !== undefined)
}

export function restartLessonAttempt(progress: LessonProgress, attemptId: string, now: number): LessonProgress {
  return {
    ...progress,
    attemptId,
    attemptCompletedAt: undefined,
    attemptScore: undefined,
    stepAnswers: {},
    hintedStepIds: [],
    currentStepIndex: 0,
    lastStepId: undefined,
    updatedAt: now,
  }
}

export function finishLessonAttempt(lessonId: string, current: LessonProgress | undefined, score: number | undefined, now: number): LessonProgress {
  return {
    ...current,
    lessonId,
    status: "completed",
    startedAt: current?.startedAt ?? now,
    // First completion remains a historical fact when the learner practices again.
    completedAt: current?.completedAt ?? now,
    score: current?.status === "completed" ? current.score : score,
    ...(current?.attemptId ? { attemptCompletedAt: now, attemptScore: score } : {}),
    updatedAt: now,
  }
}
