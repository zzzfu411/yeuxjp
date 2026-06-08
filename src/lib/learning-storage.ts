"use client"

export const LEARNING_EVENT = "yasashi:learning:update"

export function readLearningJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[learning-storage] Failed to read ${key}:`, e)
    }
    return fallback
  }
}

export function writeLearningJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(LEARNING_EVENT, { detail: { key } }))
    return true
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[learning-storage] Failed to write ${key}:`, e)
    }
    return false
  }
}
