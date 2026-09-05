"use client"

import { enrollSrs } from "@/lib/srs"
import { runLearningStorageTransaction } from "@/lib/learning-store"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import { isReviewableKanaId } from "@/lib/review-visibility"
import type { PracticeResult } from "@/lib/learning-progress"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { Question, QuestionResult } from "@/lib/questions"
import { questionToMistakeInput } from "@/lib/questions"
import { readLessonProgressMapResult } from "@/lib/learning-progress-storage"

type LearningProgressApi = ReturnType<typeof useLearningProgress>
type MistakeNotebookApi = ReturnType<typeof useMistakeNotebook>
type PracticeRecordOptions = { enrollReviewOnCorrect?: boolean }

export function getReviewStorageKey(itemType: PracticeResult["itemType"]) {
  if (itemType === "kana") return STORAGE_KEYS.SRS_KANA
  if (itemType === "vocab") return STORAGE_KEYS.SRS_VOCAB
  return null
}

export function canEnrollReviewItem(itemType: PracticeResult["itemType"], itemId: string) {
  const storageKey = getReviewStorageKey(itemType)
  if (!storageKey) return false
  if (itemType === "kana") return isReviewableKanaId(itemId)
  if (itemType === "vocab") return isKnownVocabularyId(itemId)
  return false
}

export function enrollReviewItem(itemType: PracticeResult["itemType"], itemId: string) {
  if (!canEnrollReviewItem(itemType, itemId)) return true
  const storageKey = getReviewStorageKey(itemType)
  if (!storageKey) return true
  return enrollSrs(storageKey, itemId)
}

function recordPracticeResultWithoutTransaction(
  progress: LearningProgressApi,
  result: Omit<PracticeResult, "createdAt">,
  options: PracticeRecordOptions = {}
) {
  const recorded = progress.recordPractice(result)
  if (!recorded) return false
  if (result.correct && !result.assisted && options.enrollReviewOnCorrect !== false) {
    return enrollReviewItem(result.itemType, result.itemId)
  }
  return true
}

export function recordPracticeResult(progress: LearningProgressApi, result: Omit<PracticeResult, "createdAt">) {
  return runLearningStorageTransaction(() => recordPracticeResultWithoutTransaction(progress, result))
}

export function recordMistakeIfWrong(notebook: MistakeNotebookApi, result: QuestionResult) {
  const input = questionToMistakeInput(result)
  if (!input) return true
  return notebook.recordWrong(input)
}

export type RecordableQuestion = Question & {
  itemId: string
  itemType: PracticeResult["itemType"]
  mode: PracticeResult["mode"]
}

export function isRecordableQuestion(question: Question): question is RecordableQuestion {
  return !!question.itemId && !!question.itemType && !!question.mode
}

function canSkipProgressForLegacyMistakeReview(question: Question) {
  return !!question.mistakeId && !isRecordableQuestion(question)
}

export function recordQuestionPractice({
  progress,
  notebook,
  result,
  lessonId,
  lessonStepId,
  enrollReviewOnCorrect,
}: {
  progress?: LearningProgressApi
  notebook?: MistakeNotebookApi
  result: QuestionResult
  lessonId?: string
  lessonStepId?: string
  enrollReviewOnCorrect?: boolean
}) {
  return runLearningStorageTransaction(() => recordQuestionPracticeWithoutTransaction({
    progress,
    notebook,
    result,
    lessonId,
    lessonStepId,
    enrollReviewOnCorrect,
  }))
}

export function recordLessonQuestionPractice({
  progress,
  notebook,
  result,
  lessonId,
  lessonStepId,
  lessonAttemptId,
}: {
  progress: LearningProgressApi
  notebook?: MistakeNotebookApi
  result: QuestionResult
  lessonId: string
  lessonStepId: string
  lessonAttemptId?: string
}) {
  return runLearningStorageTransaction(() => {
    const stored = readLessonProgressMapResult()
    if (!stored.ok || stored.value[lessonId]?.attemptId !== lessonAttemptId) return false
    if (stored.value[lessonId]?.hintedStepIds?.includes(lessonStepId)) result = { ...result, assisted: true }
    const recorded = recordQuestionPracticeWithoutTransaction({
      progress,
      notebook,
      result,
      lessonId,
      lessonStepId,
      lessonAttemptId,
    })
    if (!recorded) return false

    return progress.saveLessonStepAnswer(lessonId, lessonStepId, {
      answer: result.selectedAnswer,
      correct: result.correct,
      createdAt: result.answeredAt,
      ...(result.assisted ? { assisted: true } : {}),
    })
  })
}

export function recordQuestionPracticeWithoutTransaction({
  progress,
  notebook,
  result,
  lessonId,
  lessonStepId,
  enrollReviewOnCorrect,
  lessonAttemptId,
}: {
  progress?: LearningProgressApi
  notebook?: MistakeNotebookApi
  result: QuestionResult
  lessonId?: string
  lessonStepId?: string
  enrollReviewOnCorrect?: boolean
  lessonAttemptId?: string
}) {
  const { question } = result

  if (progress && !canSkipProgressForLegacyMistakeReview(question)) {
    if (!isRecordableQuestion(question)) return false
    if (!recordPracticeResultWithoutTransaction(progress, {
      lessonId,
      lessonStepId,
      itemId: question.itemId,
      itemType: question.itemType,
      mode: question.mode,
      correct: result.correct,
      answer: result.selectedAnswer,
      ...(lessonAttemptId ? { lessonAttemptId } : {}),
      ...(result.assisted ? { assisted: true } : {}),
    }, { enrollReviewOnCorrect })) {
      return false
    }
  }

  if (notebook) {
    return recordMistakeIfWrong(notebook, result)
  }

  return true
}
