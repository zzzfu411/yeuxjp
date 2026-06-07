"use client"

import { useCallback } from "react"
import type { useLearningProgress } from "@/lib/learning-progress"
import { recordQuestionPractice } from "@/lib/learning-session"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import { makeQuestionResult, type Question, type QuestionResult } from "@/lib/questions"

type LearningProgressApi = ReturnType<typeof useLearningProgress>
type MistakeNotebookApi = ReturnType<typeof useMistakeNotebook>

export function useReviewAnswerRecorder({
  progress,
  notebook,
  recordAnswer,
  grade,
}: {
  progress: LearningProgressApi
  notebook: MistakeNotebookApi
  recordAnswer: (answer: string, correct: boolean) => boolean
  grade: (result: QuestionResult) => void
}) {
  return useCallback((question: Question, selectedAnswer: string) => {
    const result = makeQuestionResult(question, selectedAnswer)
    if (!recordAnswer(selectedAnswer, result.correct)) return false

    grade(result)
    recordQuestionPractice({ progress, notebook, result })
    return true
  }, [grade, notebook, progress, recordAnswer])
}
