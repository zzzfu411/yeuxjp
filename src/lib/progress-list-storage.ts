"use client"

export const PROGRESS_UPDATE_EVENT = "yasashi:progress:update"

export function readProgressList(storageKey: string, label: string = "progress-list") {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x) => typeof x === "string") as string[]
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
    window.localStorage.setItem(storageKey, JSON.stringify(list))
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
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATE_EVENT, { detail: { storageKey } }))
}
