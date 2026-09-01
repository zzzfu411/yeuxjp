import { useCallback, useEffect, useState } from "react"
import { warnInDevelopment } from "@/lib/dev-log"
import { LEARNING_STORE_EVENT, runLearningStorageTransaction } from "@/lib/learning-store"
import { notifyProgressList, PROGRESS_UPDATE_EVENT, readProgressListResult, writeProgressList } from "@/lib/progress-list-storage"
import { clearSrs, enrollSrs, removeSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { filterKnownVocabularyIds, isKnownVocabularyId } from "@/data/vocabulary/id-registry"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.VOCAB_LEARNED
const DEFAULT_EXCLUSION_STORAGE_KEY = STORAGE_KEYS.VOCAB_MASTERY_EXCLUDED
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB
const STORAGE_LABEL = "vocab-progress"
const EXCLUSION_STORAGE_LABEL = "vocab-progress-excluded"

export function useVocabProgress(
  storageKey: string = DEFAULT_STORAGE_KEY,
  exclusionStorageKey: string = DEFAULT_EXCLUSION_STORAGE_KEY
) {
  const [learned, setLearned] = useState<Set<string>>(() => new Set())
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set())
  const [loaded, setLoaded] = useState(false)
  const readLearned = useCallback(() => {
    const result = readProgressListResult(storageKey, STORAGE_LABEL)
    return { ...result, value: filterKnownVocabularyIds(result.value) }
  }, [storageKey])
  const readExcluded = useCallback(() => {
    const result = readProgressListResult(exclusionStorageKey, EXCLUSION_STORAGE_LABEL)
    return { ...result, value: filterKnownVocabularyIds(result.value) }
  }, [exclusionStorageKey])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setLearned(new Set(readLearned().value))
      setExcluded(new Set(readExcluded().value))
      setLoaded(true)
    })

    const sync = () => {
      setLearned(new Set(readLearned().value))
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
  }, [exclusionStorageKey, readExcluded, readLearned, storageKey])

  const isLearnedId = useCallback((id: string) => learned.has(id), [learned])

  const setLearnedId = useCallback(
    (id: string, nextLearned: boolean) => {
      if (!isKnownVocabularyId(id)) return true

      const current = readLearned()
      const currentExcluded = readExcluded()
      if (!current.ok || !currentExcluded.ok) return false
      const next = new Set(current.value)
      const nextExcluded = new Set(currentExcluded.value)

      if (nextLearned) {
        next.add(id)
        nextExcluded.delete(id)
      } else {
        next.delete(id)
        nextExcluded.add(id)
      }

      const saved = runLearningStorageTransaction(() => {
        const srsSuccess = nextLearned
          ? enrollSrs(VOCAB_SRS_STORAGE_KEY, id)
          : removeSrs(VOCAB_SRS_STORAGE_KEY, id)
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
        warnInDevelopment("[vocab-progress] Save failed, rolling back state change")
        return false
      }

      setLearned(next)
      setExcluded(nextExcluded)
      notifyProgressList(storageKey)
      notifyProgressList(exclusionStorageKey)
      return true
    },
    [exclusionStorageKey, readExcluded, readLearned, storageKey]
  )

  const toggleLearnedId = useCallback(
    (id: string) => setLearnedId(id, !learned.has(id)),
    [learned, setLearnedId]
  )

  const clearLearned = useCallback((idsToExclude: Iterable<string> = learned) => {
    const currentExcluded = readExcluded()
    const nextExcluded = new Set(currentExcluded.value)
    for (const id of filterKnownVocabularyIds(idsToExclude)) nextExcluded.add(id)

    const saved = runLearningStorageTransaction(
      () => clearSrs(VOCAB_SRS_STORAGE_KEY) && writeProgressList(
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
      setLearned(new Set())
      setExcluded(nextExcluded)
      notifyProgressList(storageKey)
      notifyProgressList(exclusionStorageKey)
      return true
    }

    warnInDevelopment("[vocab-progress] Clear failed, keeping current state")
    return false
  }, [exclusionStorageKey, learned, readExcluded, storageKey])

  return { learned, excluded, loaded, isLearnedId, setLearnedId, toggleLearnedId, clearLearned }
}
