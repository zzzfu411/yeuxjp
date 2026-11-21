"use client"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { readJsonStorage, validJsonStorageValue, invalidJsonStorageValue } from "@/lib/storage-read-result"
import { writeLearningJson } from "@/lib/learning-storage"
import { runLearningStorageTransaction } from "@/lib/learning-storage-transaction"
import { prepareStudyCalendarWrite } from "@/lib/study-calendar-storage"
import { makeWrittenWork, normalizeWrittenWorks, writingKey, workToken, type WritingTask, type WrittenWorkMap, type WorkInput } from "@/lib/written-work-model"

export function readWrittenWorks() {
  return readJsonStorage(STORAGE_KEYS.WRITTEN_WORKS, {} as WrittenWorkMap, input => {
    const value = normalizeWrittenWorks(input)
    return value ? validJsonStorageValue(value) : invalidJsonStorageValue<WrittenWorkMap>()
  }, "written-work")
}
/** Caller holds the learning write lock. Compare this work, so unrelated works can save concurrently. */
export function saveWrittenWork(task: WritingTask, input: WorkInput, expectedToken: string, complete = false, now = Date.now()) {
  const stored = readWrittenWorks()
  const key = writingKey(task)
  if (!stored.ok || workToken(stored.value[key]) !== expectedToken) return null
  const next = makeWrittenWork(task, input, complete, now)
  if (!next) return null
  const writeCalendar = complete ? prepareStudyCalendarWrite({ kind: "self-reported", createdAt: now }) : () => true
  if (!writeCalendar || !runLearningStorageTransaction(() =>
    writeLearningJson(STORAGE_KEYS.WRITTEN_WORKS, { ...stored.value, [key]: next }, { expectedRaw: stored.raw }) && writeCalendar()
  )) return null
  return next
}
