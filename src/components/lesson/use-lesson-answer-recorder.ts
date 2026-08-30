"use client"

import { useCallback, type Dispatch, type SetStateAction } from "react"
import type { LessonStep } from "@/data/lessons"
import { isPracticeStep } from "@/data/lessons"
import type { useLearningProgress } from "@/lib/learning-progress"
import { recordQuestionPractice } from "@/lib/learning-session"
import {
  resolveLessonStepSubmission,
  type PersistedLessonStepAnswerMap,
} from "@/lib/lesson-session"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"

type LearningProgressApi = ReturnType<typeof useLearningProgress>
type MistakeNotebookApi = ReturnType<typeof useMistakeNotebook>

export function useLessonAnswerRecorder({
  lessonId,
  progress,
  notebook,
  persistedAnswers,
  setAnswered,
}: {
  lessonId: string
  progress: LearningProgressApi
  notebook: MistakeNotebookApi
  persistedAnswers: PersistedLessonStepAnswerMap
  setAnswered: Dispatch<SetStateAction<Record<string, boolean>>>
}) {
  return useCallback((step: LessonStep, answer: string) => {
    if (!isPracticeStep(step)) return null

    const { result, shouldRecord } = resolveLessonStepSubmission(step, answer, persistedAnswers[step.id])

    if (shouldRecord && !recordQuestionPractice({
      progress,
      notebook,
      result,
      lessonId,
      lessonStepId: step.id,
    })) {
      return null
    }
    if (shouldRecord && !progress.saveLessonStepAnswer(lessonId, step.id, {
      answer: result.selectedAnswer,
      correct: result.correct,
      createdAt: result.answeredAt,
    })) {
      return null
    }

    setAnswered((prev) => ({ ...prev, [step.id]: result.correct }))
    return result
  }, [lessonId, notebook, persistedAnswers, progress, setAnswered])
}
