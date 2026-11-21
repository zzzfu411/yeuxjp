"use client"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { readJsonStorage, validJsonStorageValue, invalidJsonStorageValue } from "@/lib/storage-read-result"
import { writeLearningJson } from "@/lib/learning-storage"
import { EMPTY_DIAGNOSTIC_STORE, normalizeDiagnosticStore, applyDiagnosticAction, type DiagnosticStore, type DiagnosticAction } from "@/lib/stage-diagnostic-model"

export function readStageDiagnostics() {
  return readJsonStorage(STORAGE_KEYS.DIAGNOSTICS, EMPTY_DIAGNOSTIC_STORE, input => {
    const value = normalizeDiagnosticStore(input)
    return value ? validJsonStorageValue(value) : invalidJsonStorageValue<DiagnosticStore>()
  }, "stage-diagnostics")
}
/** Apply only to the latest store while holding the shared learning write lock. */
export function saveDiagnosticAction(action: DiagnosticAction, now = Date.now()) {
  const stored = readStageDiagnostics()
  if (!stored.ok) return false
  const next = applyDiagnosticAction(stored.value, action, now)
  if (!next || !normalizeDiagnosticStore(next)) return false
  return writeLearningJson(STORAGE_KEYS.DIAGNOSTICS, next, { expectedRaw: stored.raw })
}
