"use client"

import { STORAGE_KEYS, type StorageKey } from "@/lib/storage-keys"
import { filterKnownVocabularyIds, isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import {
  beginLearningNotificationTransaction,
  discardLearningNotificationsFrom,
  endLearningNotificationTransaction,
  flushQueuedLearningNotifications,
  isOuterLearningNotificationTransaction,
  notifyLearningStoreEvent,
} from "@/lib/learning-events"
import { normalizeMistakeList } from "@/lib/mistake-notebook-model"
import {
  normalizeItemProgressMap,
  normalizeLessonProgressMap,
  normalizePracticeResults,
  normalizeProfile,
} from "@/lib/learning-progress-model"
import { normalizeProgressList } from "@/lib/progress-list-storage"
import { isReviewableKanaId } from "@/lib/review-visibility"
import { normalizeSpeechPreferences } from "@/lib/speech-preferences-model"
import { normalizeSrsState } from "@/lib/srs-model"

export const LEARNING_BACKUP_VERSION = 1
export { LEARNING_STORE_EVENT, queueLearningNotification } from "@/lib/learning-events"

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

type LearningStoreAction = "backup" | "restore" | "reset" | "rollback"

function parseStoredJson(value: string) {
  try {
    return { ok: true as const, value: JSON.parse(value) as unknown }
  } catch {
    return { ok: false as const }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function normalizeSrsMapForBackup(input: unknown, isAllowedId: (id: string) => boolean = () => true, now: number = Date.now()) {
  if (!isPlainObject(input)) return null
  const out: Record<string, ReturnType<typeof normalizeSrsState>> = {}
  for (const [id, value] of Object.entries(input)) {
    const itemId = id.trim()
    if (!itemId || !isPlainObject(value)) return null
    if (!isAllowedId(itemId)) continue
    out[itemId] = normalizeSrsState(value, now)
  }
  return out
}

function normalizeBackupEntry(key: LearningBackupKey, rawValue: string, now: number = Date.now()): string | null {
  const parsed = parseStoredJson(rawValue)
  if (!parsed.ok) return null

  switch (key) {
    case STORAGE_KEYS.USER_PROFILE: {
      if (!isPlainObject(parsed.value)) return null
      const profile = normalizeProfile(parsed.value, now)
      return profile ? JSON.stringify(profile) : null
    }
    case STORAGE_KEYS.LESSON_PROGRESS: {
      if (!isPlainObject(parsed.value)) return null
      return JSON.stringify(normalizeLessonProgressMap(parsed.value, now))
    }
    case STORAGE_KEYS.ITEM_PROGRESS: {
      if (!isPlainObject(parsed.value)) return null
      return JSON.stringify(normalizeItemProgressMap(parsed.value, now))
    }
    case STORAGE_KEYS.PRACTICE_RESULTS: {
      if (!Array.isArray(parsed.value)) return null
      return JSON.stringify(normalizePracticeResults(parsed.value, now))
    }
    case STORAGE_KEYS.SRS_MISTAKES: {
      const map = normalizeSrsMapForBackup(parsed.value, undefined, now)
      return map ? JSON.stringify(map) : null
    }
    case STORAGE_KEYS.SRS_KANA: {
      const map = normalizeSrsMapForBackup(parsed.value, isReviewableKanaId, now)
      return map ? JSON.stringify(map) : null
    }
    case STORAGE_KEYS.SRS_VOCAB: {
      const map = normalizeSrsMapForBackup(parsed.value, isKnownVocabularyId, now)
      return map ? JSON.stringify(map) : null
    }
    case STORAGE_KEYS.MISTAKES: {
      if (!Array.isArray(parsed.value)) return null
      return JSON.stringify(normalizeMistakeList(parsed.value, now))
    }
    case STORAGE_KEYS.KANA_MASTERED: {
      if (!Array.isArray(parsed.value)) return null
      return JSON.stringify(normalizeProgressList(parsed.value).filter(isReviewableKanaId))
    }
    case STORAGE_KEYS.VOCAB_LEARNED: {
      if (!Array.isArray(parsed.value)) return null
      return JSON.stringify(filterKnownVocabularyIds(normalizeProgressList(parsed.value)))
    }
    case STORAGE_KEYS.SPEECH_PREFS:
      if (!isPlainObject(parsed.value)) return null
      return JSON.stringify(normalizeSpeechPreferences(parsed.value))
  }
}

function filterOrphanMistakeSrsEntries(entries: LearningBackup["entries"], now: number = Date.now()) {
  const mistakesEntry = entries[STORAGE_KEYS.MISTAKES]
  const mistakeSrsEntry = entries[STORAGE_KEYS.SRS_MISTAKES]
  if (typeof mistakeSrsEntry !== "string") {
    return true
  }

  const mistakes = typeof mistakesEntry === "string" ? normalizeMistakeList(JSON.parse(mistakesEntry), now) : []
  const mistakeIds = new Set(mistakes.map((item) => item.id))
  const mistakeSrs = normalizeSrsMapForBackup(JSON.parse(mistakeSrsEntry), (id) => mistakeIds.has(id), now)
  if (mistakeSrs === null) return false
  entries[STORAGE_KEYS.SRS_MISTAKES] = JSON.stringify(mistakeSrs)
  return true
}

function normalizeLearningBackup(backup: Partial<LearningBackup>, now: number = Date.now()): LearningBackup | null {
  if (backup.version !== LEARNING_BACKUP_VERSION) return null
  if (typeof backup.exportedAt !== "number" || !Number.isFinite(backup.exportedAt)) return null
  if (!backup.entries || typeof backup.entries !== "object") return null

  const entries: LearningBackup["entries"] = {}
  for (const [key, value] of Object.entries(backup.entries)) {
    if (!BACKUP_KEY_SET.has(key)) continue
    if (typeof value !== "string") continue
    const normalized = normalizeBackupEntry(key as LearningBackupKey, value, now)
    if (normalized === null) return null
    entries[key as LearningBackupKey] = normalized
  }

  if (!filterOrphanMistakeSrsEntries(entries, now)) return null

  return {
    version: LEARNING_BACKUP_VERSION,
    exportedAt: backup.exportedAt,
    entries,
  }
}

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
        window.localStorage.setItem(key, value)
      } else {
        window.localStorage.removeItem(key)
      }
    }
    return true
  } catch {
    return false
  }
}

function rollbackLearningKeys(snapshot: Partial<Record<LearningBackupKey, string | null>>, notify = true) {
  if (!applyLearningSnapshot(snapshot)) return false
  if (notify) notifyLearningStore({ action: "rollback", keys: BACKUP_KEYS })
  return true
}

export function getLearningBackupKeys() {
  return [...BACKUP_KEYS]
}

export function runLearningStorageTransaction(commit: () => boolean) {
  const previous = snapshotLearningKeys()
  if (!previous) return false
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
    if (isOuterTransaction) flushQueuedLearningNotifications()
    return true
  }

  discardLearningNotificationsFrom(notificationStart)
  rollbackLearningKeys(previous, isOuterTransaction)
  return false
}

export function createLearningBackup(now: number = Date.now()): LearningBackup {
  return tryCreateLearningBackup(now) ?? { version: LEARNING_BACKUP_VERSION, exportedAt: now, entries: {} }
}

export function tryCreateLearningBackup(now: number = Date.now()): LearningBackup | null {
  const entries: LearningBackup["entries"] = {}

  if (typeof window !== "undefined") {
    try {
      for (const key of BACKUP_KEYS) {
        const value = window.localStorage.getItem(key)
        if (value === null) continue
        const normalized = normalizeBackupEntry(key, value, now)
        if (normalized === null) return null
        entries[key] = normalized
      }
      if (!filterOrphanMistakeSrsEntries(entries, now)) return null
    } catch {
      return null
    }
  }

  notifyLearningStore({ action: "backup", keys: Object.keys(entries) })
  return { version: LEARNING_BACKUP_VERSION, exportedAt: now, entries }
}

export function restoreLearningBackup(backup: LearningBackup) {
  if (typeof window === "undefined") return false
  const normalizedBackup = normalizeLearningBackup(backup)
  if (!normalizedBackup) return false

  const previous = snapshotLearningKeys()
  if (!previous) return false

  try {
    for (const key of BACKUP_KEYS) {
      const value = normalizedBackup.entries[key]
      if (typeof value === "string") {
        window.localStorage.setItem(key, value)
      } else {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    rollbackLearningKeys(previous)
    return false
  }

  notifyLearningStore({ action: "restore", keys: BACKUP_KEYS })
  return true
}

export function resetLearningData() {
  if (typeof window === "undefined") return false

  const previous = snapshotLearningKeys()
  if (!previous) return false

  try {
    for (const key of BACKUP_KEYS) {
      window.localStorage.removeItem(key)
    }
  } catch {
    rollbackLearningKeys(previous)
    return false
  }

  notifyLearningStore({ action: "reset", keys: BACKUP_KEYS })
  return true
}

export function parseLearningBackup(input: string): LearningBackup | null {
  try {
    const parsed = JSON.parse(input) as unknown
    if (!parsed || typeof parsed !== "object") return null
    return normalizeLearningBackup(parsed as Partial<LearningBackup>)
  } catch {
    return null
  }
}
