import { useCallback, useEffect, useState } from "react"
import { LEARNING_STORE_EVENT, runLearningStorageTransaction } from "@/lib/learning-store"
import { notifyProgressList, PROGRESS_UPDATE_EVENT, readProgressList, writeProgressList } from "@/lib/progress-list-storage"
import { clearSrs, enrollSrs, removeSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.VOCAB_LEARNED
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB
const STORAGE_LABEL = "vocab-progress"

export function useVocabProgress(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [learned, setLearned] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setLearned(new Set(readProgressList(storageKey, STORAGE_LABEL)))
    })

    const sync = () => setLearned(new Set(readProgressList(storageKey, STORAGE_LABEL)))

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
  }, [storageKey])

  const isLearnedId = useCallback((id: string) => learned.has(id), [learned])

  const toggleLearnedId = useCallback(
    (id: string) => {
      const base = new Set(readProgressList(storageKey, STORAGE_LABEL))
      const next = new Set(base)
      const wasLearned = next.has(id)

      if (wasLearned) {
        next.delete(id)
      } else {
        next.add(id)
      }

      const saved = runLearningStorageTransaction(() => {
        const srsSuccess = wasLearned ? removeSrs(VOCAB_SRS_STORAGE_KEY, id) : enrollSrs(VOCAB_SRS_STORAGE_KEY, id)
        return srsSuccess && writeProgressList(storageKey, Array.from(next), STORAGE_LABEL)
      })

      if (!saved) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[vocab-progress] Save failed, rolling back state change")
        }
        return false
      }

      setLearned(next)
      notifyProgressList(storageKey)
      return true
    },
    [storageKey]
  )

  const clearLearned = useCallback(() => {
    const saved = runLearningStorageTransaction(() => clearSrs(VOCAB_SRS_STORAGE_KEY) && writeProgressList(storageKey, [], STORAGE_LABEL))
    if (saved) {
      setLearned(new Set())
      notifyProgressList(storageKey)
      return true
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("[vocab-progress] Clear failed, keeping current state")
    }
    return false
  }, [storageKey])

  return { learned, isLearnedId, toggleLearnedId, clearLearned }
}
