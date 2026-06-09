"use client"

import { STORAGE_KEYS, type StorageKey } from "@/lib/storage-keys"

export const LEARNING_BACKUP_VERSION = 1
export const LEARNING_STORE_EVENT = "yasashi:learning-store:update"

const BACKUP_KEYS = [
  STORAGE_KEYS.USER_PROFILE,
  STORAGE_KEYS.LESSON_PROGRESS,
  STORAGE_KEYS.ITEM_PROGRESS,
  STORAGE_KEYS.PRACTICE_RESULTS,
  STORAGE_KEYS.SRS_KANA,
  STORAGE_KEYS.SRS_VOCAB,
  STORAGE_KEYS.SRS_MISTAKES,
  STORAGE_KEYS.MISTAKES,
  STORAGE_KEYS.KANA_MASTERED,
  STORAGE_KEYS.VOCAB_LEARNED,
  STORAGE_KEYS.SPEECH_PREFS,
] as const satisfies readonly StorageKey[]

export type LearningBackupKey = (typeof BACKUP_KEYS)[number]
const BACKUP_KEY_SET = new Set<string>(BACKUP_KEYS)

export interface LearningBackup {
  version: typeof LEARNING_BACKUP_VERSION
  exportedAt: number
  entries: Partial<Record<LearningBackupKey, string>>
}

function notifyLearningStore(detail: { action: "backup" | "restore" | "reset"; keys: readonly string[] }) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(LEARNING_STORE_EVENT, { detail }))
}

export function getLearningBackupKeys() {
  return [...BACKUP_KEYS]
}

export function createLearningBackup(now: number = Date.now()): LearningBackup {
  const entries: LearningBackup["entries"] = {}

  if (typeof window !== "undefined") {
    for (const key of BACKUP_KEYS) {
      const value = window.localStorage.getItem(key)
      if (value !== null) entries[key] = value
    }
  }

  notifyLearningStore({ action: "backup", keys: Object.keys(entries) })
  return { version: LEARNING_BACKUP_VERSION, exportedAt: now, entries }
}

export function restoreLearningBackup(backup: LearningBackup) {
  if (typeof window === "undefined") return false
  if (backup.version !== LEARNING_BACKUP_VERSION) return false

  for (const key of BACKUP_KEYS) {
    const value = backup.entries[key]
    if (typeof value === "string") {
      window.localStorage.setItem(key, value)
    } else {
      window.localStorage.removeItem(key)
    }
  }

  notifyLearningStore({ action: "restore", keys: BACKUP_KEYS })
  return true
}

export function resetLearningData() {
  if (typeof window === "undefined") return false

  for (const key of BACKUP_KEYS) {
    window.localStorage.removeItem(key)
  }

  notifyLearningStore({ action: "reset", keys: BACKUP_KEYS })
  return true
}

export function parseLearningBackup(input: string): LearningBackup | null {
  try {
    const parsed = JSON.parse(input) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const backup = parsed as Partial<LearningBackup>
    if (backup.version !== LEARNING_BACKUP_VERSION) return null
    if (typeof backup.exportedAt !== "number" || !Number.isFinite(backup.exportedAt)) return null
    if (!backup.entries || typeof backup.entries !== "object") return null
    const entries: LearningBackup["entries"] = {}
    for (const [key, value] of Object.entries(backup.entries)) {
      if (!BACKUP_KEY_SET.has(key)) continue
      if (typeof value !== "string") continue
      entries[key as LearningBackupKey] = value
    }
    return {
      version: LEARNING_BACKUP_VERSION,
      exportedAt: backup.exportedAt,
      entries,
    }
  } catch {
    return null
  }
}
