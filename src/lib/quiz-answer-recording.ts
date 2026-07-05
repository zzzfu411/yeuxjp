"use client"

import { recordQuestionPractice } from "@/lib/learning-session"
import { makeQuestionResult, type Question } from "@/lib/questions"
import { recordQuizAnswer, type QuizStats } from "@/lib/quiz-session"

type QuestionPracticeParams = Parameters<typeof recordQuestionPractice>[0]

export type QuizStatsUpdater = (updater: (stats: QuizStats) => QuizStats) => void

export type QuizQuestionPracticeParams = Pick<QuestionPracticeParams, "progress" | "notebook"> & {
  question: Question
  selectedAnswer: string
  updateStats: QuizStatsUpdater
}

export function recordQuizQuestionPractice({
  progress,
  notebook,
  question,
  selectedAnswer,
  updateStats,
}: QuizQuestionPracticeParams) {
  const result = makeQuestionResult(question, selectedAnswer)
  if (!recordQuestionPractice({ progress, notebook, result })) return null

  updateStats((prev) => recordQuizAnswer(prev, result.correct))
  return result
}
