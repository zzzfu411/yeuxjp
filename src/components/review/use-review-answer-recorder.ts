"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import { useCallback, useRef } from "react"
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
  const pending = useRef<Promise<boolean> | null>(null)
  return useCallback((question: Question, selectedAnswer: string) => {
    if (pending.current) return pending.current
    const task = runLearningWrite(() => recordReviewQuestionPractice({
      progress,
      notebook,
      question,
      selectedAnswer,
      recordAnswer,
      canRecord,
      grade,
    })).finally(() => { pending.current = null })
    pending.current = task
    return task
  }, [canRecord, grade, notebook, progress, recordAnswer])
}
