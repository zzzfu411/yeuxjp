"use client"

import { useCallback, type Dispatch, type SetStateAction } from "react"
import type { LessonStep } from "@/data/lessons"
import { isPracticeStep } from "@/data/lessons"
import type { useLearningProgress } from "@/lib/learning-progress"
import { recordQuestionPractice } from "@/lib/learning-session"
import { lessonStepToQuestion } from "@/lib/lesson-session"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import { makeQuestionResult } from "@/lib/questions"

type LearningProgressApi = ReturnType<typeof useLearningProgress>
type MistakeNotebookApi = ReturnType<typeof useMistakeNotebook>

export function useLessonAnswerRecorder({
  lessonId,
  progress,
  notebook,
  setAnswered,
}: {
  lessonId: string
  progress: LearningProgressApi
  notebook: MistakeNotebookApi
  setAnswered: Dispatch<SetStateAction<Record<string, boolean>>>
}) {
  return useCallback((step: LessonStep, answer: string) => {
    if (!isPracticeStep(step)) return null

    const question = lessonStepToQuestion(step)
    const result = makeQuestionResult(question, answer)

    if (!recordQuestionPractice({
      progress,
      notebook,
      result,
      lessonId,
      lessonStepId: step.id,
    })) {
      return null
    }

    setAnswered((prev) => ({ ...prev, [step.id]: result.correct }))
    return result
  }, [lessonId, notebook, progress, setAnswered])
}
