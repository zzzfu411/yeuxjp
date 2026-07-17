"use client"

import {
  beginLearningNotificationTransaction,
  discardLearningNotificationsFrom,
  endLearningNotificationTransaction,
  flushQueuedLearningNotifications,
  isOuterLearningNotificationTransaction,
  notifyLearningStoreEvent,
} from "@/lib/learning-events"
import {
  beginManagedLearningStorageTransaction,
  endManagedLearningStorageTransaction,
  removeManagedLearningStorage,
  writeManagedLearningStorage,
  type ManagedLearningStorageMutation,
} from "@/lib/managed-learning-storage"
import {
  BACKUP_KEYS,
  LEARNING_BACKUP_VERSION,
  filterOrphanMistakeSrsEntries,
  normalizeBackupEntry,
  normalizeLearningBackup,
  parseLearningBackupText,
  safeLearningBackupTimestamp,
  type LearningBackup,
  type LearningBackupKey,
} from "@/lib/learning-backup"

export { LEARNING_STORE_EVENT, queueLearningNotification } from "@/lib/learning-events"
export { removeManagedLearningStorage, writeManagedLearningStorage } from "@/lib/managed-learning-storage"
export { LEARNING_BACKUP_VERSION } from "@/lib/learning-backup"
export type { LearningBackup, LearningBackupKey } from "@/lib/learning-backup"

type LearningStoreAction = "backup" | "restore" | "reset" | "rollback"

function notifyLearningStore(detail: { action: LearningStoreAction; keys: readonly string[] }) {
  notifyLearningStoreEvent(detail)
}

function snapshotLearningKeys() {
  const snapshot: Partial<Record<LearningBackupKey, string | null>> = {}
  if (typeof window === "undefined") return snapshot

  try {
    for (const key of BACKUP_KEYS) {
      snapshot[key] = window.localStorage.getItem(key)
    }
  } catch {
    return null
  }

  return snapshot
}

function applyLearningSnapshot(snapshot: Partial<Record<LearningBackupKey, string | null>>) {
  if (typeof window === "undefined") return false

  try {
    for (const key of BACKUP_KEYS) {
      const value = snapshot[key]
      if (typeof value === "string") {
        writeManagedLearningStorage(key, value)
      } else {
        removeManagedLearningStorage(key)
      }
    }
    return true
  } catch {
    return false
  }
}

function rollbackLearningMutations(mutations: readonly ManagedLearningStorageMutation[]) {
  if (typeof window === "undefined") return false

  try {
    for (const mutation of mutations) {
      const current = window.localStorage.getItem(mutation.key)
      if (current !== mutation.after) continue
      if (typeof mutation.before === "string") {
        writeManagedLearningStorage(mutation.key, mutation.before)
      } else {
        removeManagedLearningStorage(mutation.key)
      }
    }
    return true
  } catch {
    return false
  }
}

function rollbackLearningKeys(
  snapshot: Partial<Record<LearningBackupKey, string | null>>,
  notify = true,
  mutations?: readonly ManagedLearningStorageMutation[]
) {
  const rolledBack = mutations ? rollbackLearningMutations(mutations) : applyLearningSnapshot(snapshot)
  if (notify) notifyLearningStore({ action: "rollback", keys: BACKUP_KEYS })
  return rolledBack
}

export function getLearningBackupKeys() {
  return [...BACKUP_KEYS]
}

export function runLearningStorageTransaction(commit: () => boolean) {
  const previous = snapshotLearningKeys()
  if (!previous) return false
  const storageTransaction = beginManagedLearningStorageTransaction()
  const isOuterTransaction = isOuterLearningNotificationTransaction()
  const notificationStart = beginLearningNotificationTransaction()

  let saved = false
  try {
    saved = commit()
  } catch {
    // Treat thrown storage/persistence failures like false commits so callers get rollback semantics.
    saved = false
  } finally {
    endLearningNotificationTransaction()
  }

  if (saved) {
    endManagedLearningStorageTransaction(storageTransaction)
    if (isOuterTransaction) flushQueuedLearningNotifications()
    return true
  }

  discardLearningNotificationsFrom(notificationStart)
  const mutations = endManagedLearningStorageTransaction(storageTransaction)
  rollbackLearningKeys(previous, isOuterTransaction, mutations)
  return false
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
