import { useCallback, useEffect, useState } from "react"
import { LEARNING_STORE_EVENT, runLearningStorageTransaction } from "@/lib/learning-store"
import { notifyProgressList, PROGRESS_UPDATE_EVENT, readProgressList, writeProgressList } from "@/lib/progress-list-storage"
import { isReviewableKanaId } from "@/lib/review-visibility"
import { clearSrs, enrollSrs, removeSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.KANA_MASTERED
const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const STORAGE_LABEL = "kana-progress"

export function useKanaProgress(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [mastered, setMastered] = useState<Set<string>>(() => new Set())
  const readMastered = useCallback(() => readProgressList(storageKey, STORAGE_LABEL).filter(isReviewableKanaId), [storageKey])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setMastered(new Set(readMastered()))
    })

    const sync = () => setMastered(new Set(readMastered()))

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

  const isMastered = useCallback((romaji: string) => mastered.has(romaji), [mastered])

  const toggleMastered = useCallback(
    (romaji: string) => {
      if (!isReviewableKanaId(romaji)) return true

      const base = new Set(readMastered())
      const next = new Set(base)
      const wasMastered = next.has(romaji)

      if (wasMastered) {
        next.delete(romaji)
      } else {
        next.add(romaji)
      }

      const saved = runLearningStorageTransaction(() => {
        const srsSuccess = wasMastered ? removeSrs(KANA_SRS_STORAGE_KEY, romaji) : enrollSrs(KANA_SRS_STORAGE_KEY, romaji)
        return srsSuccess && writeProgressList(storageKey, Array.from(next), STORAGE_LABEL)
      })

      if (!saved) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[kana-progress] Save failed, rolling back state change")
        }
        return false
      }

      setMastered(next)
      notifyProgressList(storageKey)
      return true
    },
    [readMastered, storageKey]
  )

  const clearMastered = useCallback(() => {
    const saved = runLearningStorageTransaction(() => clearSrs(KANA_SRS_STORAGE_KEY) && writeProgressList(storageKey, [], STORAGE_LABEL))
    if (saved) {
      setMastered(new Set())
      notifyProgressList(storageKey)
      return true
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("[kana-progress] Clear failed, keeping current state")
    }
    return false
  }, [storageKey])

  return { mastered, isMastered, toggleMastered, clearMastered }
}
