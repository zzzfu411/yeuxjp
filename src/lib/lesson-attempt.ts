import type { LessonProgress } from "@/lib/learning-progress-model"
import type { Lesson } from "@/data/lesson-types"
import { getLessonUpdates, isCurrentLessonAnswer } from "@/lib/lesson-content-version"
import { getLessonConsolidation } from "@/lib/lesson-consolidation"

export function resumeLessonConsolidationAttempt(progress: LessonProgress, lesson: Lesson, attemptId: string, now: number): LessonProgress | null {
  const ids = getLessonConsolidation(lesson.id, progress).practiceStepIds
  if (progress.status !== "completed" || !ids.length) return null
  const selected = new Set(ids)
  const stepAnswers = { ...progress.stepAnswers }
  const supersededAnswers = { ...progress.supersededAnswers }
  for (const id of ids) {
    if (stepAnswers[id]) supersededAnswers[`${id}@consolidation:${attemptId}`] = stepAnswers[id]
    delete stepAnswers[id]
  }
  return {
    ...progress, attemptId, attemptCompletedAt: undefined, attemptScore: undefined,
    stepAnswers, supersededAnswers,
    hintedStepIds: progress.hintedStepIds?.filter(id => !selected.has(id)),
    updateStepIds: ids,
    currentStepIndex: lesson.steps.findIndex(step => step.id === ids[0]),
    lastStepId: ids[0], updatedAt: now,
  }
}

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
    updateStepIds: undefined,
    currentStepIndex: 0,
    lastStepId: undefined,
    updatedAt: now,
  }
}

export function resumeLessonUpdateAttempt(progress: LessonProgress, lesson: Lesson, attemptId: string, now: number): LessonProgress | null {
  const updates = getLessonUpdates(lesson, progress)
  if (!updates.length) return null
  return {
    ...progress,
    attemptId,
    attemptCompletedAt: undefined,
    attemptScore: undefined,
    updateStepIds: updates.map(step => step.id),
    currentStepIndex: lesson.steps.findIndex(step => step.id === updates[0].id),
    lastStepId: updates[0].id,
    hintedStepIds: (progress.hintedStepIds ?? []).filter(id => {
      const step = lesson.steps.find(item => item.id === id)
      return step && isCurrentLessonAnswer(step, progress.stepAnswers?.[id])
    }),
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
    ...(current?.updateStepIds ? { updateStepIds: undefined } : {}),
    updatedAt: now,
  }
}
