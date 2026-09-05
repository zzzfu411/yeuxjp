"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import { useCallback, type Dispatch, type SetStateAction } from "react"
import type { LessonStep } from "@/data/lesson-types"
import { isPracticeStep } from "@/lib/lesson-step-kind"
import type { useLearningProgress } from "@/lib/learning-progress"
import { recordLessonQuestionPractice } from "@/lib/learning-session"
import {
  resolveLessonStepSubmission,
  type PersistedLessonStepAnswerMap,
} from "@/lib/lesson-session"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import { readLessonProgressMapResult } from "@/lib/learning-progress-storage"

type LearningProgressApi = ReturnType<typeof useLearningProgress>
type MistakeNotebookApi = ReturnType<typeof useMistakeNotebook>

export function useLessonAnswerRecorder({
  lessonId,
  progress,
  notebook,
  setAnswered,
  attemptId,
}: {
  lessonId: string
  progress: LearningProgressApi
  notebook: MistakeNotebookApi
  persistedAnswers: PersistedLessonStepAnswerMap
  setAnswered: Dispatch<SetStateAction<Record<string, boolean>>>
  attemptId?: string
  hintedStepIds?: string[]
}) {
  return useCallback((step: LessonStep, answer: string) => runLearningWrite(() => {
    if (!isPracticeStep(step)) return null

    const stored = readLessonProgressMapResult()
    const current = stored.value[lessonId]
    if (!stored.ok || !current || current.attemptId !== attemptId) return null
    const resolved = resolveLessonStepSubmission(step, answer, current.stepAnswers?.[step.id])
    const { shouldRecord } = resolved
    const result = current.hintedStepIds?.includes(step.id) ? { ...resolved.result, assisted: true } : resolved.result

    if (shouldRecord && !recordLessonQuestionPractice({
      progress,
      notebook,
      result,
      lessonId,
      lessonStepId: step.id,
      lessonAttemptId: attemptId,
    })) {
      return null
    }

    setAnswered((prev) => ({ ...prev, [step.id]: result.correct && !result.assisted }))
    return result
  }), [attemptId, lessonId, notebook, progress, setAnswered])
}
