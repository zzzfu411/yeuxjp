import { useCallback, useEffect, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { clearSrs, enrollSrs, removeSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.KANA_MASTERED
const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
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
      console.warn("[kana-progress] Failed to read from localStorage:", e)
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
      console.warn("[kana-progress] Failed to write to localStorage:", e)
    }
    return false
  }
}

function notifyProgress(storageKey: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATE_EVENT, { detail: { storageKey } }))
}

export function useKanaProgress(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [mastered, setMastered] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setMastered(new Set(readList(storageKey)))
    })

    const sync = () => setMastered(new Set(readList(storageKey)))

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

  const isMastered = useCallback((romaji: string) => mastered.has(romaji), [mastered])

  const toggleMastered = useCallback(
    (romaji: string) => {
      setMastered((prev) => {
        const next = new Set(prev)
        const wasMastered = next.has(romaji)

        if (wasMastered) {
          next.delete(romaji)
        } else {
          next.add(romaji)
        }

        // 先写入掌握状态
        const writeSuccess = writeList(storageKey, Array.from(next))

        // 只有写入成功后才更新SRS状态，保持一致性
        if (writeSuccess) {
          if (wasMastered) {
            removeSrs(KANA_SRS_STORAGE_KEY, romaji)
          } else {
            enrollSrs(KANA_SRS_STORAGE_KEY, romaji)
          }
          notifyProgress(storageKey)
        } else {
          // 写入失败，回滚状态
          if (process.env.NODE_ENV === "development") {
            console.warn("[kana-progress] Write failed, rolling back state change")
          }
          return prev
        }

        return next
      })
    },
    [storageKey]
  )

  const clearMastered = useCallback(() => {
    setMastered((prev) => {
      const writeSuccess = writeList(storageKey, [])
      if (writeSuccess) {
        clearSrs(KANA_SRS_STORAGE_KEY)
        notifyProgress(storageKey)
        return new Set()
      }
      // 写入失败，保持原状态
      if (process.env.NODE_ENV === "development") {
        console.warn("[kana-progress] Clear failed, keeping current state")
      }
      return prev
    })
  }, [storageKey])

  return { mastered, isMastered, toggleMastered, clearMastered }
}
