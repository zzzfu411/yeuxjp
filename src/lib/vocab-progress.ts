import { useCallback, useEffect, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { clearSrs, enrollSrs, removeSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.VOCAB_LEARNED
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB
const PROGRESS_UPDATE_EVENT = "yasashi:progress:update"

function readList(storageKey: string) {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x) => typeof x === "string") as string[]
  } catch (e) {
    // 添加错误日志，帮助调试
    if (process.env.NODE_ENV === "development") {
      console.warn("[vocab-progress] Failed to read from localStorage:", e)
    }
    return []
  }
}

function writeList(storageKey: string, list: string[]): boolean {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(list))
    return true
  } catch (e) {
    // 添加错误日志
    if (process.env.NODE_ENV === "development") {
      console.warn("[vocab-progress] Failed to write to localStorage:", e)
    }
    return false
  }
}

function notifyProgress(storageKey: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATE_EVENT, { detail: { storageKey } }))
}

export function useVocabProgress(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [learned, setLearned] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setLearned(new Set(readList(storageKey)))
    })

    const sync = () => setLearned(new Set(readList(storageKey)))

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
        const writeSuccess = writeList(storageKey, Array.from(next))

        // 只有写入成功后才更新SRS状态，保持一致性
        if (writeSuccess) {
          if (wasLearned) {
            removeSrs(VOCAB_SRS_STORAGE_KEY, id)
          } else {
            enrollSrs(VOCAB_SRS_STORAGE_KEY, id)
          }
          notifyProgress(storageKey)
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
      const writeSuccess = writeList(storageKey, [])
      if (writeSuccess) {
        clearSrs(VOCAB_SRS_STORAGE_KEY)
        notifyProgress(storageKey)
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
