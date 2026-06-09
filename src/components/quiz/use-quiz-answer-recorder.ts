"use client"

import { useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { useLearningProgress } from "@/lib/learning-progress"
import { recordQuestionPractice } from "@/lib/learning-session"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import { makeQuestionResult, type Question } from "@/lib/questions"
import { recordQuizAnswer, type QuizStats } from "@/lib/quiz-session"

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
    const result = makeQuestionResult(question, selectedAnswer)
    if (!recordQuestionPractice({ progress, notebook, result })) return null

    setQuizStats((prev) => recordQuizAnswer(prev, result.correct))
    return result
  }, [notebook, progress, setQuizStats])
}
