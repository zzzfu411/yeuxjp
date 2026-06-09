import { useCallback, useEffect, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { notifyProgressList, PROGRESS_UPDATE_EVENT, readProgressList, writeProgressList } from "@/lib/progress-list-storage"
import { clearSrs, enrollSrs, removeSrs } from "@/lib/srs"
import { notifySrs, readSrsMap, writeSrsMap } from "@/lib/srs-storage"
import { STORAGE_KEYS } from "@/lib/storage-keys"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.KANA_MASTERED
const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const STORAGE_LABEL = "kana-progress"

export function useKanaProgress(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [mastered, setMastered] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setMastered(new Set(readProgressList(storageKey, STORAGE_LABEL)))
    })

    const sync = () => setMastered(new Set(readProgressList(storageKey, STORAGE_LABEL)))

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
      const base = new Set(readProgressList(storageKey, STORAGE_LABEL))
      const next = new Set(base)
      const wasMastered = next.has(romaji)

      if (wasMastered) {
        next.delete(romaji)
      } else {
        next.add(romaji)
      }

      const previousSrs = readSrsMap(KANA_SRS_STORAGE_KEY)
      const srsSuccess = wasMastered ? removeSrs(KANA_SRS_STORAGE_KEY, romaji) : enrollSrs(KANA_SRS_STORAGE_KEY, romaji)
      if (!srsSuccess) return false

      const writeSuccess = writeProgressList(storageKey, Array.from(next), STORAGE_LABEL)

      if (!writeSuccess) {
        if (writeSrsMap(KANA_SRS_STORAGE_KEY, previousSrs)) notifySrs(KANA_SRS_STORAGE_KEY)
        if (process.env.NODE_ENV === "development") {
          console.warn("[kana-progress] Write failed, rolling back state change")
        }
        return false
      }

      setMastered(next)
      notifyProgressList(storageKey)
      return true
    },
    [storageKey]
  )

  const clearMastered = useCallback(() => {
    const previousSrs = readSrsMap(KANA_SRS_STORAGE_KEY)
    if (!clearSrs(KANA_SRS_STORAGE_KEY)) return false

    const writeSuccess = writeProgressList(storageKey, [], STORAGE_LABEL)
    if (writeSuccess) {
      setMastered(new Set())
      notifyProgressList(storageKey)
      return true
    }

    if (writeSrsMap(KANA_SRS_STORAGE_KEY, previousSrs)) notifySrs(KANA_SRS_STORAGE_KEY)
    if (process.env.NODE_ENV === "development") {
      console.warn("[kana-progress] Clear failed, keeping current state")
    }
    return false
  }, [storageKey])

  return { mastered, isMastered, toggleMastered, clearMastered }
}
