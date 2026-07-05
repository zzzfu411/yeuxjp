"use client"

import { useCallback } from "react"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { Question, QuestionResult } from "@/lib/questions"
import { recordReviewQuestionPractice } from "@/lib/review-answer-recording"

type LearningProgressApi = ReturnType<typeof useLearningProgress>
type MistakeNotebookApi = ReturnType<typeof useMistakeNotebook>

export function useReviewAnswerRecorder({
  progress,
  notebook,
  recordAnswer,
  canRecord,
  grade,
}: {
  progress: LearningProgressApi
  notebook: MistakeNotebookApi
  recordAnswer: (answer: string, correct: boolean, beforeCommit?: () => boolean) => boolean
  canRecord?: (result: QuestionResult) => boolean
  grade: (result: QuestionResult) => boolean
}) {
  return useCallback((question: Question, selectedAnswer: string) => {
    return recordReviewQuestionPractice({
      progress,
      notebook,
      question,
      selectedAnswer,
      recordAnswer,
      canRecord,
      grade,
    })
  }, [canRecord, grade, notebook, progress, recordAnswer])
}
