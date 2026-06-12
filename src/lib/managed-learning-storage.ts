"use client"

import { STORAGE_KEYS, type StorageKey } from "@/lib/storage-keys"

export const MANAGED_LEARNING_STORAGE_KEYS = [
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

export type ManagedLearningStorageKey = (typeof MANAGED_LEARNING_STORAGE_KEYS)[number]

export type ManagedLearningStorageMutation = {
  key: ManagedLearningStorageKey
  before: string | null
  after: string | null
}

export type ManagedLearningStorageTransaction = {
  mutations: Map<ManagedLearningStorageKey, ManagedLearningStorageMutation>
}

const MANAGED_LEARNING_STORAGE_KEY_SET = new Set<string>(MANAGED_LEARNING_STORAGE_KEYS)
const TRANSACTION_STACK_KEY = Symbol.for("managed-learning-storage.transactions")
type ManagedLearningStorageGlobal = typeof globalThis & {
  [TRANSACTION_STACK_KEY]?: ManagedLearningStorageTransaction[]
}
const managedLearningStorageGlobal = globalThis as ManagedLearningStorageGlobal
const activeTransactions = managedLearningStorageGlobal[TRANSACTION_STACK_KEY] ?? []
managedLearningStorageGlobal[TRANSACTION_STACK_KEY] = activeTransactions

function asManagedLearningStorageKey(key: string): ManagedLearningStorageKey | null {
  return MANAGED_LEARNING_STORAGE_KEY_SET.has(key) ? (key as ManagedLearningStorageKey) : null
}

function recordManagedMutation(key: string, before: string | null, after: string | null) {
  const managedKey = asManagedLearningStorageKey(key)
  if (!managedKey) return

  for (const transaction of activeTransactions) {
    const existing = transaction.mutations.get(managedKey)
    if (existing) {
      existing.after = after
    } else {
      transaction.mutations.set(managedKey, { key: managedKey, before, after })
    }
  }
}

export function beginManagedLearningStorageTransaction(): ManagedLearningStorageTransaction {
  const transaction: ManagedLearningStorageTransaction = { mutations: new Map() }
  activeTransactions.push(transaction)
  return transaction
}

export function endManagedLearningStorageTransaction(transaction: ManagedLearningStorageTransaction) {
  const index = activeTransactions.lastIndexOf(transaction)
  if (index >= 0) activeTransactions.splice(index, 1)
  return [...transaction.mutations.values()]
}

export function writeManagedLearningStorage(key: string, value: string) {
  if (typeof window === "undefined") return false
  const before = window.localStorage.getItem(key)
  window.localStorage.setItem(key, value)
  recordManagedMutation(key, before, value)
  return true
}

export function removeManagedLearningStorage(key: string) {
  if (typeof window === "undefined") return false
  const before = window.localStorage.getItem(key)
  window.localStorage.removeItem(key)
  recordManagedMutation(key, before, null)
  return true
}
