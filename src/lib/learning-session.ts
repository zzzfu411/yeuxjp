"use client"

import { enrollSrs } from "@/lib/srs"
import { runLearningStorageTransaction } from "@/lib/learning-store"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import { isReviewableKanaId } from "@/lib/review-visibility"
import type { PracticeResult } from "@/lib/learning-progress"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { QuestionResult } from "@/lib/questions"
import { questionToMistakeInput } from "@/lib/questions"

type LearningProgressApi = ReturnType<typeof useLearningProgress>
type MistakeNotebookApi = ReturnType<typeof useMistakeNotebook>
type PracticeRecordOptions = { enrollReviewOnCorrect?: boolean }

export function getReviewStorageKey(itemType: PracticeResult["itemType"]) {
  if (itemType === "kana") return STORAGE_KEYS.SRS_KANA
  if (itemType === "vocab") return STORAGE_KEYS.SRS_VOCAB
  return null
}

export function enrollReviewItem(itemType: PracticeResult["itemType"], itemId: string) {
  const storageKey = getReviewStorageKey(itemType)
  if (!storageKey) return true
  if (itemType === "kana" && !isReviewableKanaId(itemId)) return true
  if (itemType === "vocab" && !isKnownVocabularyId(itemId)) return true
  return enrollSrs(storageKey, itemId)
}

function recordPracticeResultWithoutTransaction(
  progress: LearningProgressApi,
  result: Omit<PracticeResult, "createdAt">,
  options: PracticeRecordOptions = {}
) {
  const recorded = progress.recordPractice(result)
  if (!recorded) return false
  if (result.correct && options.enrollReviewOnCorrect !== false) {
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

export function recordQuestionPracticeWithoutTransaction({
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
  const { question } = result

  if (progress && question.itemId && question.itemType && question.mode) {
    if (!recordPracticeResultWithoutTransaction(progress, {
      lessonId,
      lessonStepId,
      itemId: question.itemId,
      itemType: question.itemType,
      mode: question.mode,
      correct: result.correct,
      answer: result.selectedAnswer,
    }, { enrollReviewOnCorrect })) {
      return false
    }
  }

  if (notebook) {
    return recordMistakeIfWrong(notebook, result)
  }

  return true
}
