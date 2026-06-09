"use client"

import { normalizeMistakeList, type MistakeItem } from "@/lib/mistake-notebook-model"

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
