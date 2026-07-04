"use client"

import { useCallback } from "react"
import type { useLearningProgress } from "@/lib/learning-progress"
import { recordQuestionPracticeWithoutTransaction } from "@/lib/learning-session"
import { runLearningStorageTransaction } from "@/lib/learning-store"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import { makeQuestionResult, type Question, type QuestionResult } from "@/lib/questions"

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
    const result = makeQuestionResult(question, selectedAnswer)
    if (!recordAnswer(selectedAnswer, result.correct, () => {
      return runLearningStorageTransaction(() => {
        if (canRecord && !canRecord(result)) return false
        const recorded = recordQuestionPracticeWithoutTransaction({
          progress,
          notebook,
          result,
          enrollReviewOnCorrect: false,
        })
        if (!recorded) return false
        return grade(result)
      })
    })) {
      return false
    }
    return true
  }, [canRecord, grade, notebook, progress, recordAnswer])
}
