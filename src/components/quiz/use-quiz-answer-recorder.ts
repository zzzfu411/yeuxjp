"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import { useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { Question } from "@/lib/questions"
import { recordQuizQuestionPractice } from "@/lib/quiz-answer-recording"
import type { QuizStats } from "@/lib/quiz-session"

type LearningProgressApi = ReturnType<typeof useLearningProgress>
type MistakeNotebookApi = ReturnType<typeof useMistakeNotebook>

export function useQuizAnswerRecorder({
  progress,
  notebook,
  setQuizStats,
}: {
  progress: LearningProgressApi
  notebook: MistakeNotebookApi
  setQuizStats: Dispatch<SetStateAction<QuizStats>>
}) {
  return useCallback((question: Question, selectedAnswer: string) => {
    return runLearningWrite(() => recordQuizQuestionPractice({
      progress,
      notebook,
      question,
      selectedAnswer,
      updateStats: setQuizStats,
    }))
  }, [notebook, progress, setQuizStats])
}
