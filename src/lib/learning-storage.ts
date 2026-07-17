"use client"

import { queueLearningNotification } from "@/lib/learning-events"
import { writeManagedLearningStorage } from "@/lib/managed-learning-storage"
import { warnInDevelopment } from "@/lib/dev-log"
import {
  canWriteJsonStorage,
  readJsonStorage,
  validJsonStorageValue,
  type JsonStorageDecodeResult,
  type JsonStorageWriteOptions,
} from "@/lib/storage-read-result"

export const LEARNING_EVENT = "yasashi:learning:update"

export function readLearningJsonResult<T>(
  key: string,
  fallback: T,
  decode: (input: unknown) => JsonStorageDecodeResult<T> = (input) => validJsonStorageValue(input as T)
) {
  return readJsonStorage(key, fallback, decode, "learning-storage")
}

export function readLearningJson<T>(key: string, fallback: T): T {
  return readLearningJsonResult(key, fallback).value
}

export function writeLearningJson<T>(key: string, value: T, options: JsonStorageWriteOptions = {}) {
  if (typeof window === "undefined") return false
  if (!canWriteJsonStorage(readLearningJsonResult(key, null), options)) return false
  try {
    writeManagedLearningStorage(key, JSON.stringify(value))
    queueLearningNotification(() => {
      window.dispatchEvent(new CustomEvent(LEARNING_EVENT, { detail: { key } }))
    })
    return true
  } catch (e) {
    warnInDevelopment(`[learning-storage] Failed to write ${key}:`, e)
    return false
  }
}
