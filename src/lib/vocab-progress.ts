import { useCallback, useEffect, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
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
      setLearned((prev) => {
        const next = new Set(prev)
        const wasLearned = next.has(id)

        if (wasLearned) {
          next.delete(id)
        } else {
          next.add(id)
        }

        // 先写入学习状态
        const writeSuccess = writeProgressList(storageKey, Array.from(next), STORAGE_LABEL)

        // 只有写入成功后才更新SRS状态，保持一致性
        if (writeSuccess) {
          if (wasLearned) {
            removeSrs(VOCAB_SRS_STORAGE_KEY, id)
          } else {
            enrollSrs(VOCAB_SRS_STORAGE_KEY, id)
          }
          notifyProgressList(storageKey)
        } else {
          // 写入失败，回滚状态
          if (process.env.NODE_ENV === "development") {
            console.warn("[vocab-progress] Write failed, rolling back state change")
          }
          return prev
        }

        return next
      })
    },
    [storageKey]
  )

  const clearLearned = useCallback(() => {
    setLearned(() => {
      const writeSuccess = writeProgressList(storageKey, [], STORAGE_LABEL)
      if (writeSuccess) {
        clearSrs(VOCAB_SRS_STORAGE_KEY)
        notifyProgressList(storageKey)
        return new Set()
      }
      // 写入失败，保持原状态
      if (process.env.NODE_ENV === "development") {
        console.warn("[vocab-progress] Clear failed, keeping current state")
      }
      return learned
    })
  }, [storageKey, learned])

  return { learned, isLearnedId, toggleLearnedId, clearLearned }
}
