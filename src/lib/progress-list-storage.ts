"use client"

import { queueLearningNotification } from "@/lib/learning-events"

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
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    return normalizeProgressList(JSON.parse(raw))
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[${label}] Failed to read from localStorage:`, e)
    }
    return []
  }
}

export function writeProgressList(storageKey: string, list: string[], label: string = "progress-list"): boolean {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(normalizeProgressList(list)))
    return true
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[${label}] Failed to write to localStorage:`, e)
    }
    return false
  }
}

export function notifyProgressList(storageKey: string) {
  if (typeof window === "undefined") return
  queueLearningNotification(() => {
    window.dispatchEvent(new CustomEvent(PROGRESS_UPDATE_EVENT, { detail: { storageKey } }))
  })
}
