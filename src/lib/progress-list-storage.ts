"use client"

import { queueLearningNotification } from "@/lib/learning-events"
import { writeManagedLearningStorage } from "@/lib/managed-learning-storage"
import { warnInDevelopment } from "@/lib/dev-log"
import {
  canWriteJsonStorage,
  invalidJsonStorageValue,
  readJsonStorage,
  validJsonStorageValue,
  type JsonStorageWriteOptions,
} from "@/lib/storage-read-result"

export const PROGRESS_UPDATE_EVENT = "yasashi:progress:update"

export function normalizeProgressList(input: unknown) {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const value of input) {
    if (typeof value !== "string") continue
    const item = value.trim()
    if (!item || seen.has(item)) continue
    seen.add(item)
    normalized.push(item)
  }

  return normalized
}

export function readProgressList(storageKey: string, label: string = "progress-list") {
  return readProgressListResult(storageKey, label).value
}

export function readProgressListResult(storageKey: string, label: string = "progress-list") {
  return readJsonStorage(
    storageKey,
    [] as string[],
    (input) => {
      if (!Array.isArray(input)) return invalidJsonStorageValue<string[]>()
      const normalized = normalizeProgressList(input)
      return input.length > 0 && normalized.length === 0
        ? invalidJsonStorageValue<string[]>()
        : validJsonStorageValue(normalized)
    },
    label
  )
}

export function writeProgressList(
  storageKey: string,
  list: string[],
  label: string = "progress-list",
  options: JsonStorageWriteOptions = {}
): boolean {
  if (typeof window === "undefined") return false
  if (!canWriteJsonStorage(readProgressListResult(storageKey, label), options)) return false
  try {
    writeManagedLearningStorage(storageKey, JSON.stringify(normalizeProgressList(list)))
    return true
  } catch (e) {
    warnInDevelopment(`[${label}] Failed to write to localStorage:`, e)
    return false
  }
}

export function notifyProgressList(storageKey: string) {
  if (typeof window === "undefined") return
  queueLearningNotification(() => {
    window.dispatchEvent(new CustomEvent(PROGRESS_UPDATE_EVENT, { detail: { storageKey } }))
  })
}
