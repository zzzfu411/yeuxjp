"use client"

import { useCallback } from "react"
import { useLearningProgressState } from "@/lib/learning-progress-reader"
import { runLearningStorageTransaction } from "@/lib/learning-storage-transaction"
import { queueLearningNotification } from "@/lib/learning-events"
import { writeLearningJson } from "@/lib/learning-storage"
import { appendPracticeResult, updateItemProgressForPractice, type PracticeResult } from "@/lib/learning-progress-model"
import { readItemProgressMapResult, readPracticeResultsResult } from "@/lib/learning-progress-storage"
import { prepareStudyCalendarWrite } from "@/lib/study-calendar-storage"
import { STORAGE_KEYS } from "@/lib/storage-keys"

export function useLearningPracticeState() {
  const { snapshot, setLessons, setItems, setResults } = useLearningProgressState()

  const recordPractice = useCallback((result: Omit<PracticeResult, "createdAt">) => {
    const createdAt = Date.now()
    const previousResultsResult = readPracticeResultsResult()
    const previousItemsResult = readItemProgressMapResult()
    if (!previousResultsResult.ok || !previousItemsResult.ok) return false
    const previousResults = previousResultsResult.value
    const previousItems = previousItemsResult.value
    const nextResults = appendPracticeResult(previousResults, result, createdAt)
    const nextResult = nextResults.at(-1)
    if (!nextResult) return false

    const nextItems = updateItemProgressForPractice(previousItems, nextResult)
    const writeCalendar = prepareStudyCalendarWrite(nextResult)
    if (!writeCalendar) return false

    const saved = runLearningStorageTransaction(() => {
      const wrote = writeLearningJson(
        STORAGE_KEYS.PRACTICE_RESULTS,
        nextResults,
        { expectedRaw: previousResultsResult.raw }
      ) && writeLearningJson(
        STORAGE_KEYS.ITEM_PROGRESS,
        nextItems,
        { expectedRaw: previousItemsResult.raw }
      ) && writeCalendar()
      if (wrote) {
        queueLearningNotification(() => {
          setResults(nextResults)
          setItems(nextItems)
        })
      }
      return wrote
    })
    if (!saved) return false

    return true
  }, [setItems, setResults])

  return { learning: { ...snapshot, recordPractice }, setLessons }
}

/** Practice recording without loading lesson editing and compatibility machinery. */
export function useLearningPractice() {
  return useLearningPracticeState().learning
}
