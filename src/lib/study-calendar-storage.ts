"use client"
import { readLearningJsonResult, writeLearningJson } from "@/lib/learning-storage"
import { invalidJsonStorageValue, validJsonStorageValue } from "@/lib/storage-read-result"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { readLessonProgressMapResult, readPracticeResultsResult } from "@/lib/learning-progress-storage"
import { addLessonToCalendar, addPracticeToCalendar, mergeLegacyStudyCalendar, normalizeStudyCalendar, type StudyCalendar } from "@/lib/study-calendar-model"
import type { PracticeResult } from "@/lib/learning-progress-model"

export function readStudyCalendarResult() {
  return readLearningJsonResult(STORAGE_KEYS.STUDY_CALENDAR, {} as StudyCalendar, input => {
    const calendar = normalizeStudyCalendar(input)
    return calendar ? validJsonStorageValue(calendar) : invalidJsonStorageValue<StudyCalendar>()
  })
}

// Prepare before changing history, then commit inside the caller's transaction.
export function prepareStudyCalendarWrite(activity: PracticeResult | number) {
  const stored = readStudyCalendarResult()
  const lessons = readLessonProgressMapResult()
  const results = readPracticeResultsResult()
  if (!stored.ok || !lessons.ok || !results.ok) return null
  const base = mergeLegacyStudyCalendar(stored.value, lessons.value, results.value)
  const next = typeof activity === "number" ? addLessonToCalendar(base, activity) : addPracticeToCalendar(base, activity)
  return () => writeLearningJson(STORAGE_KEYS.STUDY_CALENDAR, next, { expectedRaw: stored.raw })
}
