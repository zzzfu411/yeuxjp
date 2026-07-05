import { STORAGE_KEYS } from "@/lib/storage-keys"
import { filterKnownVocabularyIds, isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import { MANAGED_LEARNING_STORAGE_KEYS } from "@/lib/managed-learning-keys"
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
export const BACKUP_KEYS = MANAGED_LEARNING_STORAGE_KEYS

export type LearningBackupKey = (typeof BACKUP_KEYS)[number]
const BACKUP_KEY_SET = new Set<string>(BACKUP_KEYS)

export interface LearningBackup {
  version: typeof LEARNING_BACKUP_VERSION
  exportedAt: number
  entries: Partial<Record<LearningBackupKey, string>>
}

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

export function safeLearningBackupTimestamp(value: unknown, fallback: number = Date.now()) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (Number.isFinite(fallback)) return fallback
  return 0
}

function normalizeSrsMapForBackup(input: unknown, isAllowedId: (id: string) => boolean = () => true, now: number = Date.now()) {
  const safeNow = safeLearningBackupTimestamp(now)
  if (!isPlainObject(input)) return null
  const out: Record<string, ReturnType<typeof normalizeSrsState>> = {}
  for (const [id, value] of Object.entries(input)) {
    const itemId = id.trim()
    if (!itemId || !isPlainObject(value)) return null
    if (!isAllowedId(itemId)) continue
    out[itemId] = normalizeSrsState(value, safeNow)
  }
  return out
}

export function normalizeBackupEntry(key: LearningBackupKey, rawValue: string, now: number = Date.now()): string | null {
  const safeNow = safeLearningBackupTimestamp(now)
  const parsed = parseStoredJson(rawValue)
  if (!parsed.ok) return null

  switch (key) {
    case STORAGE_KEYS.USER_PROFILE: {
      if (!isPlainObject(parsed.value)) return null
      const profile = normalizeProfile(parsed.value, safeNow)
      return profile ? JSON.stringify(profile) : null
    }
    case STORAGE_KEYS.LESSON_PROGRESS: {
      if (!isPlainObject(parsed.value)) return null
      return JSON.stringify(normalizeLessonProgressMap(parsed.value, safeNow))
    }
    case STORAGE_KEYS.ITEM_PROGRESS: {
      if (!isPlainObject(parsed.value)) return null
      return JSON.stringify(normalizeItemProgressMap(parsed.value, safeNow))
    }
    case STORAGE_KEYS.PRACTICE_RESULTS: {
      if (!Array.isArray(parsed.value)) return null
      return JSON.stringify(normalizePracticeResults(parsed.value, safeNow))
    }
    case STORAGE_KEYS.SRS_MISTAKES: {
      const map = normalizeSrsMapForBackup(parsed.value, undefined, safeNow)
      return map ? JSON.stringify(map) : null
    }
    case STORAGE_KEYS.SRS_KANA: {
      const map = normalizeSrsMapForBackup(parsed.value, isReviewableKanaId, safeNow)
      return map ? JSON.stringify(map) : null
    }
    case STORAGE_KEYS.SRS_VOCAB: {
      const map = normalizeSrsMapForBackup(parsed.value, isKnownVocabularyId, safeNow)
      return map ? JSON.stringify(map) : null
    }
    case STORAGE_KEYS.MISTAKES: {
      if (!Array.isArray(parsed.value)) return null
      return JSON.stringify(normalizeMistakeList(parsed.value, safeNow))
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

export function filterOrphanMistakeSrsEntries(entries: LearningBackup["entries"], now: number = Date.now()) {
  const safeNow = safeLearningBackupTimestamp(now)
  const mistakesEntry = entries[STORAGE_KEYS.MISTAKES]
  const mistakeSrsEntry = entries[STORAGE_KEYS.SRS_MISTAKES]
  if (typeof mistakeSrsEntry !== "string") {
    return true
  }

  const mistakes = typeof mistakesEntry === "string" ? normalizeMistakeList(JSON.parse(mistakesEntry), safeNow) : []
  const mistakeIds = new Set(mistakes.map((item) => item.id))
  const mistakeSrs = normalizeSrsMapForBackup(JSON.parse(mistakeSrsEntry), (id) => mistakeIds.has(id), safeNow)
  if (mistakeSrs === null) return false
  entries[STORAGE_KEYS.SRS_MISTAKES] = JSON.stringify(mistakeSrs)
  return true
}

export function normalizeLearningBackup(backup: Partial<LearningBackup>, now: number = Date.now()): LearningBackup | null {
  const safeNow = safeLearningBackupTimestamp(now)
  if (backup.version !== LEARNING_BACKUP_VERSION) return null
  if (typeof backup.exportedAt !== "number" || !Number.isFinite(backup.exportedAt)) return null
  if (!backup.entries || typeof backup.entries !== "object") return null

  const entries: LearningBackup["entries"] = {}
  for (const [key, value] of Object.entries(backup.entries)) {
    if (!BACKUP_KEY_SET.has(key)) continue
    if (typeof value !== "string") continue
    const normalized = normalizeBackupEntry(key as LearningBackupKey, value, safeNow)
    if (normalized === null) return null
    entries[key as LearningBackupKey] = normalized
  }

  if (!filterOrphanMistakeSrsEntries(entries, safeNow)) return null

  return {
    version: LEARNING_BACKUP_VERSION,
    exportedAt: backup.exportedAt,
    entries,
  }
}

export function parseLearningBackupText(input: string): LearningBackup | null {
  try {
    const parsed = JSON.parse(input) as unknown
    if (!parsed || typeof parsed !== "object") return null
    return normalizeLearningBackup(parsed as Partial<LearningBackup>)
  } catch {
    return null
  }
}
