import { STORAGE_KEYS } from "@/lib/storage-keys"

export function isProfileStorageKey(key: string | null | undefined) {
  return key === STORAGE_KEYS.USER_PROFILE
}

export const PROGRESS_STORAGE_KEYS = [
  STORAGE_KEYS.LESSON_PROGRESS,
  STORAGE_KEYS.ITEM_PROGRESS,
  STORAGE_KEYS.PRACTICE_RESULTS,
] as const

export function includesProgressStorageKey(keys: readonly string[] | undefined) {
  return !!keys?.some((key) => PROGRESS_STORAGE_KEYS.includes(key as (typeof PROGRESS_STORAGE_KEYS)[number]))
}

export function isProgressStorageKey(key: string | null | undefined) {
  return !!key && includesProgressStorageKey([key])
}
