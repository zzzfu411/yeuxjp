"use client"

import { queueLearningNotification } from "@/lib/learning-events"
import { writeManagedLearningStorage } from "@/lib/managed-learning-storage"
import { warnInDevelopment } from "@/lib/dev-log"
import { normalizeMistakeList, type MistakeItem } from "@/lib/mistake-notebook-model"
import {
  canWriteJsonStorage,
  invalidJsonStorageValue,
  readJsonStorage,
  validJsonStorageValue,
  type JsonStorageWriteOptions,
} from "@/lib/storage-read-result"

export const MISTAKE_NOTEBOOK_EVENT = "yasashi:mistake-notebook:update"

export function readMistakeList(storageKey: string, label: string = "mistake-notebook") {
  return readMistakeListResult(storageKey, label).value
}

export function readMistakeListResult(storageKey: string, label: string = "mistake-notebook") {
  return readJsonStorage(
    storageKey,
    [] as MistakeItem[],
    (input) => {
      if (!Array.isArray(input)) return invalidJsonStorageValue<MistakeItem[]>()
      const normalized = normalizeMistakeList(input)
      return input.length > 0 && normalized.length === 0
        ? invalidJsonStorageValue<MistakeItem[]>()
        : validJsonStorageValue(normalized)
    },
    label
  )
}

export function writeMistakeList(
  storageKey: string,
  list: readonly MistakeItem[],
  label: string = "mistake-notebook",
  options: JsonStorageWriteOptions = {}
) {
  if (typeof window === "undefined") return false
  if (!canWriteJsonStorage(readMistakeListResult(storageKey, label), options)) return false

  try {
    writeManagedLearningStorage(storageKey, JSON.stringify(list))
    return true
  } catch (e) {
    warnInDevelopment(`[${label}] Failed to write to localStorage:`, e)
    return false
  }
}

export function notifyMistakeNotebook(storageKey: string) {
  if (typeof window === "undefined") return
  queueLearningNotification(() => {
    window.dispatchEvent(new CustomEvent(MISTAKE_NOTEBOOK_EVENT, { detail: { storageKey } }))
  })
}
