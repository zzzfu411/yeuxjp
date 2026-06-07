"use client"

import { enrollSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import type { PracticeResult } from "@/lib/learning-progress"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { QuestionResult } from "@/lib/questions"
import { questionToMistakeInput } from "@/lib/questions"

type LearningProgressApi = ReturnType<typeof useLearningProgress>
type MistakeNotebookApi = ReturnType<typeof useMistakeNotebook>

export function getReviewStorageKey(itemType: PracticeResult["itemType"]) {
  if (itemType === "kana") return STORAGE_KEYS.SRS_KANA
  if (itemType === "vocab") return STORAGE_KEYS.SRS_VOCAB
  return null
}

export function enrollReviewItem(itemType: PracticeResult["itemType"], itemId: string) {
  const storageKey = getReviewStorageKey(itemType)
  if (!storageKey) return
  enrollSrs(storageKey, itemId)
}

export function recordPracticeResult(progress: LearningProgressApi, result: Omit<PracticeResult, "createdAt">) {
  progress.recordPractice(result)
  if (result.correct) {
    enrollReviewItem(result.itemType, result.itemId)
  }
}

export function recordMistakeIfWrong(notebook: MistakeNotebookApi, result: QuestionResult) {
  const input = questionToMistakeInput(result)
  if (!input) return
  notebook.recordWrong(input)
}

export function recordQuestionPractice({
  progress,
  notebook,
  result,
  lessonId,
}: {
  progress?: LearningProgressApi
  notebook?: MistakeNotebookApi
  result: QuestionResult
  lessonId?: string
}) {
  const { question } = result

  if (progress && question.itemId && question.itemType && question.mode) {
    recordPracticeResult(progress, {
      lessonId,
      itemId: question.itemId,
      itemType: question.itemType,
      mode: question.mode,
      correct: result.correct,
      answer: result.selectedAnswer,
    })
  }

  if (notebook) {
    recordMistakeIfWrong(notebook, result)
  }
}
