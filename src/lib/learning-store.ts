"use client"

import { notifyLearningStoreEvent } from "@/lib/learning-events"
import { removeManagedLearningStorage, writeManagedLearningStorage } from "@/lib/managed-learning-storage"
import { runLearningStorageTransaction } from "@/lib/learning-storage-transaction"
import {
  BACKUP_KEYS,
  LEARNING_BACKUP_VERSION,
  filterOrphanMistakeSrsEntries,
  normalizeBackupEntry,
  normalizeLearningBackup,
  parseLearningBackupText,
  safeLearningBackupTimestamp,
  type LearningBackup,
} from "@/lib/learning-backup"

export { runLearningStorageTransaction } from "@/lib/learning-storage-transaction"
export { LEARNING_STORE_EVENT, queueLearningNotification } from "@/lib/learning-events"
export { removeManagedLearningStorage, writeManagedLearningStorage } from "@/lib/managed-learning-storage"
export { LEARNING_BACKUP_VERSION } from "@/lib/learning-backup"
export type { LearningBackup, LearningBackupKey } from "@/lib/learning-backup"

type LearningStoreAction = "backup" | "restore" | "reset" | "rollback"

function notifyLearningStore(detail: { action: LearningStoreAction; keys: readonly string[] }) {
  notifyLearningStoreEvent(detail)
}

export function getLearningBackupKeys() {
  return [...BACKUP_KEYS]
}

export function createLearningBackup(now: number = Date.now()): LearningBackup {
  const exportedAt = safeLearningBackupTimestamp(now)
  return tryCreateLearningBackup(exportedAt) ?? { version: LEARNING_BACKUP_VERSION, exportedAt, entries: {} }
}

export function tryCreateLearningBackup(now: number = Date.now()): LearningBackup | null {
  const exportedAt = safeLearningBackupTimestamp(now)
  const entries: LearningBackup["entries"] = {}

  if (typeof window !== "undefined") {
    try {
      for (const key of BACKUP_KEYS) {
        const value = window.localStorage.getItem(key)
        if (value === null) continue
        const normalized = normalizeBackupEntry(key, value, exportedAt)
        if (normalized === null) return null
        entries[key] = normalized
      }
      if (!filterOrphanMistakeSrsEntries(entries, exportedAt)) return null
    } catch {
      return null
    }
  }

  notifyLearningStore({ action: "backup", keys: Object.keys(entries) })
  return { version: LEARNING_BACKUP_VERSION, exportedAt, entries }
}

export function restoreLearningBackup(backup: LearningBackup) {
  if (typeof window === "undefined") return false
  const normalizedBackup = normalizeLearningBackup(backup)
  if (!normalizedBackup) return false

  const saved = runLearningStorageTransaction(() => {
    for (const key of BACKUP_KEYS) {
      const value = normalizedBackup.entries[key]
      if (typeof value === "string") {
        writeManagedLearningStorage(key, value)
      } else {
        removeManagedLearningStorage(key)
      }
    }
    return true
  })

  if (!saved) return false

  notifyLearningStore({ action: "restore", keys: BACKUP_KEYS })
  return true
}

export function resetLearningData() {
  if (typeof window === "undefined") return false

  const saved = runLearningStorageTransaction(() => {
    for (const key of BACKUP_KEYS) {
      removeManagedLearningStorage(key)
    }
    return true
  })

  if (!saved) return false

  notifyLearningStore({ action: "reset", keys: BACKUP_KEYS })
  return true
}

export function parseLearningBackup(input: string): LearningBackup | null {
  return parseLearningBackupText(input)
}
