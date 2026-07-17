"use client"

import {
  normalizeItemProgressMap,
  normalizeLessonProgressMap,
  normalizePracticeResults,
  normalizeProfile,
  type ItemProgressMap,
  type LessonProgressMap,
  type PracticeResult,
  type UserProfile,
} from "@/lib/learning-progress-model"
import { readLearningJsonResult } from "@/lib/learning-storage"
import { invalidJsonStorageValue, validJsonStorageValue } from "@/lib/storage-read-result"
import { STORAGE_KEYS } from "@/lib/storage-keys"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function readLessonProgressMapResult() {
  return readLearningJsonResult(
    STORAGE_KEYS.LESSON_PROGRESS,
    {} as LessonProgressMap,
    (input) => {
      if (!isPlainObject(input)) return invalidJsonStorageValue<LessonProgressMap>()
      const normalized = normalizeLessonProgressMap(input)
      return Object.keys(input).length > 0 && Object.keys(normalized).length === 0
        ? invalidJsonStorageValue<LessonProgressMap>()
        : validJsonStorageValue(normalized)
    }
  )
}

export function readItemProgressMapResult() {
  return readLearningJsonResult(
    STORAGE_KEYS.ITEM_PROGRESS,
    {} as ItemProgressMap,
    (input) => {
      if (!isPlainObject(input)) return invalidJsonStorageValue<ItemProgressMap>()
      const normalized = normalizeItemProgressMap(input)
      return Object.keys(input).length > 0 && Object.keys(normalized).length === 0
        ? invalidJsonStorageValue<ItemProgressMap>()
        : validJsonStorageValue(normalized)
    }
  )
}

export function readPracticeResultsResult() {
  return readLearningJsonResult(
    STORAGE_KEYS.PRACTICE_RESULTS,
    [] as PracticeResult[],
    (input) => {
      if (!Array.isArray(input)) return invalidJsonStorageValue<PracticeResult[]>()
      const normalized = normalizePracticeResults(input)
      return input.length > 0 && normalized.length === 0
        ? invalidJsonStorageValue<PracticeResult[]>()
        : validJsonStorageValue(normalized)
    }
  )
}

export function readUserProfileResult() {
  return readLearningJsonResult(
    STORAGE_KEYS.USER_PROFILE,
    null as UserProfile | null,
    (input) => {
      if (!isPlainObject(input)) return invalidJsonStorageValue<UserProfile | null>()
      const profile = normalizeProfile(input)
      return profile ? validJsonStorageValue(profile) : invalidJsonStorageValue<UserProfile | null>()
    }
  )
}
