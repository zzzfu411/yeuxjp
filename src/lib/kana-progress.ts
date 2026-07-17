import { useCallback, useEffect, useState } from "react"
import { warnInDevelopment } from "@/lib/dev-log"
import { normalizeKanaIdList } from "@/lib/kana-id"
import { LEARNING_STORE_EVENT, runLearningStorageTransaction } from "@/lib/learning-store"
import { notifyProgressList, PROGRESS_UPDATE_EVENT, readProgressListResult, writeProgressList } from "@/lib/progress-list-storage"
import { isReviewableKanaId } from "@/lib/review-visibility"
import { clearSrs, enrollSrs, removeSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.KANA_MASTERED
const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const STORAGE_LABEL = "kana-progress"

export function useKanaProgress(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [mastered, setMastered] = useState<Set<string>>(() => new Set())
  const readMastered = useCallback(() => {
    const result = readProgressListResult(storageKey, STORAGE_LABEL)
    return { ...result, value: normalizeKanaIdList(result.value) }
  }, [storageKey])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setMastered(new Set(readMastered().value))
    })

    const sync = () => setMastered(new Set(readMastered().value))

    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return
      sync()
    }

    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent).detail as { storageKey?: string } | undefined
      if (detail?.storageKey !== storageKey) return
      sync()
    }

    const onLearningStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(storageKey)) return
      sync()
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(PROGRESS_UPDATE_EVENT, onCustom)
    window.addEventListener(LEARNING_STORE_EVENT, onLearningStore)

    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(PROGRESS_UPDATE_EVENT, onCustom)
      window.removeEventListener(LEARNING_STORE_EVENT, onLearningStore)
    }
  }, [readMastered, storageKey])

  const isMastered = useCallback((id: string) => mastered.has(id), [mastered])

  const toggleMastered = useCallback(
    (id: string) => {
      if (!isReviewableKanaId(id)) return true

      const current = readMastered()
      if (!current.ok) return false
      const base = new Set(current.value)
      const next = new Set(base)
      const wasMastered = next.has(id)

      if (wasMastered) {
        next.delete(id)
      } else {
        next.add(id)
      }

      const saved = runLearningStorageTransaction(() => {
        const srsSuccess = wasMastered ? removeSrs(KANA_SRS_STORAGE_KEY, id) : enrollSrs(KANA_SRS_STORAGE_KEY, id)
        return srsSuccess && writeProgressList(
          storageKey,
          Array.from(next),
          STORAGE_LABEL,
          { expectedRaw: current.raw }
        )
      })

      if (!saved) {
        warnInDevelopment("[kana-progress] Save failed, rolling back state change")
        return false
      }

      setMastered(next)
      notifyProgressList(storageKey)
      return true
    },
    [readMastered, storageKey]
  )

  const clearMastered = useCallback(() => {
    const saved = runLearningStorageTransaction(
      () => clearSrs(KANA_SRS_STORAGE_KEY) && writeProgressList(
        storageKey,
        [],
        STORAGE_LABEL,
        { replaceInvalid: true }
      )
    )
    if (saved) {
      setMastered(new Set())
      notifyProgressList(storageKey)
      return true
    }

    warnInDevelopment("[kana-progress] Clear failed, keeping current state")
    return false
  }, [storageKey])

  return { mastered, isMastered, toggleMastered, clearMastered }
}
