import { useCallback, useEffect, useState } from "react"
import { warnInDevelopment } from "@/lib/dev-log"
import { normalizeKanaIdList } from "@/lib/kana-id"
import { LEARNING_STORE_EVENT, runLearningStorageTransaction } from "@/lib/learning-store"
import { notifyProgressList, PROGRESS_UPDATE_EVENT, readProgressListResult, writeProgressList } from "@/lib/progress-list-storage"
import { isReviewableKanaId } from "@/lib/review-visibility"
import { clearSrs, enrollSrs, removeSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.KANA_MASTERED
const DEFAULT_EXCLUSION_STORAGE_KEY = STORAGE_KEYS.KANA_MASTERY_EXCLUDED
const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const STORAGE_LABEL = "kana-progress"
const EXCLUSION_STORAGE_LABEL = "kana-progress-excluded"

export function useKanaProgress(
  storageKey: string = DEFAULT_STORAGE_KEY,
  exclusionStorageKey: string = DEFAULT_EXCLUSION_STORAGE_KEY
) {
  const [mastered, setMastered] = useState<Set<string>>(() => new Set())
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set())
  const [loaded, setLoaded] = useState(false)
  const readMastered = useCallback(() => {
    const result = readProgressListResult(storageKey, STORAGE_LABEL)
    return { ...result, value: normalizeKanaIdList(result.value) }
  }, [storageKey])
  const readExcluded = useCallback(() => {
    const result = readProgressListResult(exclusionStorageKey, EXCLUSION_STORAGE_LABEL)
    return { ...result, value: normalizeKanaIdList(result.value) }
  }, [exclusionStorageKey])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setMastered(new Set(readMastered().value))
      setExcluded(new Set(readExcluded().value))
      setLoaded(true)
    })

    const sync = () => {
      setMastered(new Set(readMastered().value))
      setExcluded(new Set(readExcluded().value))
      setLoaded(true)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== exclusionStorageKey) return
      sync()
    }

    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent).detail as { storageKey?: string } | undefined
      if (detail?.storageKey !== storageKey && detail?.storageKey !== exclusionStorageKey) return
      sync()
    }

    const onLearningStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.some((key) => key === storageKey || key === exclusionStorageKey)) return
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
  }, [exclusionStorageKey, readExcluded, readMastered, storageKey])

  const isMastered = useCallback((id: string) => mastered.has(id), [mastered])

  const setMasteredId = useCallback(
    (id: string, nextMastered: boolean) => {
      if (!isReviewableKanaId(id)) return true

      const current = readMastered()
      const currentExcluded = readExcluded()
      if (!current.ok || !currentExcluded.ok) return false
      const next = new Set(current.value)
      const nextExcluded = new Set(currentExcluded.value)

      if (nextMastered) {
        next.add(id)
        nextExcluded.delete(id)
      } else {
        next.delete(id)
        nextExcluded.add(id)
      }

      const saved = runLearningStorageTransaction(() => {
        const srsSuccess = nextMastered
          ? enrollSrs(KANA_SRS_STORAGE_KEY, id)
          : removeSrs(KANA_SRS_STORAGE_KEY, id)
        return srsSuccess && writeProgressList(
          storageKey,
          Array.from(next),
          STORAGE_LABEL,
          { expectedRaw: current.raw }
        ) && writeProgressList(
          exclusionStorageKey,
          Array.from(nextExcluded),
          EXCLUSION_STORAGE_LABEL,
          { expectedRaw: currentExcluded.raw }
        )
      })

      if (!saved) {
        warnInDevelopment("[kana-progress] Save failed, rolling back state change")
        return false
      }

      setMastered(next)
      setExcluded(nextExcluded)
      notifyProgressList(storageKey)
      notifyProgressList(exclusionStorageKey)
      return true
    },
    [exclusionStorageKey, readExcluded, readMastered, storageKey]
  )

  const toggleMastered = useCallback(
    (id: string) => setMasteredId(id, !mastered.has(id)),
    [mastered, setMasteredId]
  )

  const clearMastered = useCallback((idsToExclude: Iterable<string> = mastered) => {
    const currentExcluded = readExcluded()
    const nextExcluded = new Set(currentExcluded.value)
    for (const id of normalizeKanaIdList(idsToExclude)) nextExcluded.add(id)

    const saved = runLearningStorageTransaction(
      () => clearSrs(KANA_SRS_STORAGE_KEY) && writeProgressList(
        storageKey,
        [],
        STORAGE_LABEL,
        { replaceInvalid: true }
      ) && writeProgressList(
        exclusionStorageKey,
        Array.from(nextExcluded),
        EXCLUSION_STORAGE_LABEL,
        { replaceInvalid: true }
      )
    )
    if (saved) {
      setMastered(new Set())
      setExcluded(nextExcluded)
      notifyProgressList(storageKey)
      notifyProgressList(exclusionStorageKey)
      return true
    }

    warnInDevelopment("[kana-progress] Clear failed, keeping current state")
    return false
  }, [exclusionStorageKey, mastered, readExcluded, storageKey])

  return { mastered, excluded, loaded, isMastered, setMasteredId, toggleMastered, clearMastered }
}
