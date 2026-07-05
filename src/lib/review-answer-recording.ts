"use client"

import { recordQuestionPracticeWithoutTransaction } from "@/lib/learning-session"
import { runLearningStorageTransaction } from "@/lib/learning-store"
import { makeQuestionResult, type Question, type QuestionResult } from "@/lib/questions"

type QuestionPracticeParams = Parameters<typeof recordQuestionPracticeWithoutTransaction>[0]

type ReviewCommitParams = Pick<QuestionPracticeParams, "progress" | "notebook"> & {
  result: QuestionResult
  canRecord?: (result: QuestionResult) => boolean
  grade: (result: QuestionResult) => boolean
}

export type ReviewQuestionPracticeParams = Omit<ReviewCommitParams, "result"> & {
  question: Question
  selectedAnswer: string
  recordAnswer: (answer: string, correct: boolean, beforeCommit?: () => boolean) => boolean
}

export function commitReviewQuestionPractice({
  progress,
  notebook,
  result,
  canRecord,
  grade,
}: ReviewCommitParams) {
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
}

export function recordReviewQuestionPractice({
  progress,
  notebook,
  question,
  selectedAnswer,
  recordAnswer,
  canRecord,
  grade,
}: ReviewQuestionPracticeParams) {
  const result = makeQuestionResult(question, selectedAnswer)
  return recordAnswer(selectedAnswer, result.correct, () => {
    return commitReviewQuestionPractice({
      progress,
      notebook,
      result,
      canRecord,
      grade,
    })
  })
}
