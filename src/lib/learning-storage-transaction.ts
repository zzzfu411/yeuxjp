"use client"

import {
  beginLearningNotificationTransaction,
  discardLearningNotificationsFrom,
  endLearningNotificationTransaction,
  flushQueuedLearningNotifications,
  isOuterLearningNotificationTransaction,
  notifyLearningStoreEvent as notifyLearningStore,
} from "@/lib/learning-events"
import {
  beginManagedLearningStorageTransaction,
  endManagedLearningStorageTransaction,
  removeManagedLearningStorage,
  writeManagedLearningStorage,
  type ManagedLearningStorageMutation,
} from "@/lib/managed-learning-storage"
import {
  MANAGED_LEARNING_STORAGE_KEYS as BACKUP_KEYS,
  type ManagedLearningStorageKey as LearningBackupKey,
} from "@/lib/managed-learning-keys"

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

