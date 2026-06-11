"use client"

import { normalizeMistakeList, type MistakeItem } from "@/lib/mistake-notebook-model"

export const MISTAKE_NOTEBOOK_EVENT = "yasashi:mistake-notebook:update"

export function readMistakeList(storageKey: string, label: string = "mistake-notebook") {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    return normalizeMistakeList(JSON.parse(raw))
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[${label}] Failed to read from localStorage:`, e)
    }
    return []
  }
}

export function writeMistakeList(storageKey: string, list: readonly MistakeItem[], label: string = "mistake-notebook") {
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

export function notifyMistakeNotebook(storageKey: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(MISTAKE_NOTEBOOK_EVENT, { detail: { storageKey } }))
}
