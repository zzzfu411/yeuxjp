"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT, runLearningStorageTransaction } from "@/lib/learning-store"
import { removeSrs, setSrsState, clearSrs } from "@/lib/srs"
import { applySrsResult, createSrsState } from "@/lib/srs-model"
import { buildMistakeId, removeMistakeById, upsertWrongMistake, type MistakeItem, type RecordMistakeInput } from "@/lib/mistake-notebook-model"
import { MISTAKE_NOTEBOOK_EVENT, notifyMistakeNotebook, readMistakeList, writeMistakeList } from "@/lib/mistake-notebook-storage"
import { STORAGE_KEYS } from "@/lib/storage-keys"

export type { MistakeItem, MistakeMeta, MistakeOption, RecordMistakeInput } from "@/lib/mistake-notebook-model"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.MISTAKES
export const MISTAKE_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_MISTAKES

export function useMistakeNotebook(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [list, setList] = useState<MistakeItem[]>(() => [])

  useEffect(() => {
    let cancelled = false

    const sync = () => setList(readMistakeList(storageKey))

    Promise.resolve().then(() => {
      if (cancelled) return
      sync()
    })

    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return
      sync()
    }

    const onLearningStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(storageKey)) return
      sync()
    }

    const onMistakeNotebook = (event: Event) => {
      const detail = (event as CustomEvent).detail as { storageKey?: string } | undefined
      if (detail?.storageKey !== storageKey) return
      sync()
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(MISTAKE_NOTEBOOK_EVENT, onMistakeNotebook)
    window.addEventListener(LEARNING_STORE_EVENT, onLearningStore)

    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(MISTAKE_NOTEBOOK_EVENT, onMistakeNotebook)
      window.removeEventListener(LEARNING_STORE_EVENT, onLearningStore)
    }
  }, [storageKey])

  const byId = useMemo(() => new Map(list.map((item) => [item.id, item])), [list])

  const recordWrong = useCallback(
    (input: RecordMistakeInput) => {
      const now = Date.now()
      const id = input.id ?? buildMistakeId(input)
      const previous = readMistakeList(storageKey)
      const next = upsertWrongMistake(previous, input, now)
      const saved = runLearningStorageTransaction(() => {
        return (
          setSrsState(MISTAKE_SRS_STORAGE_KEY, id, applySrsResult(createSrsState(now), "again", now)) &&
          writeMistakeList(storageKey, next)
        )
      })

      if (!saved) return false

      setList(next)
      notifyMistakeNotebook(storageKey)
      return true
    },
    [storageKey]
  )

  const remove = useCallback(
    (id: string) => {
      const previous = readMistakeList(storageKey)
      const next = removeMistakeById(previous, id)
      if (next === previous) {
        const saved = runLearningStorageTransaction(() => removeSrs(MISTAKE_SRS_STORAGE_KEY, id))
        if (!saved) return false
        setList(previous)
        notifyMistakeNotebook(storageKey)
        return true
      }
      const saved = runLearningStorageTransaction(() => {
        return removeSrs(MISTAKE_SRS_STORAGE_KEY, id) && writeMistakeList(storageKey, next)
      })

      if (!saved) return false

      setList([...next])
      notifyMistakeNotebook(storageKey)
      return true
    },
    [storageKey]
  )

  const clear = useCallback(() => {
    const saved = runLearningStorageTransaction(() => clearSrs(MISTAKE_SRS_STORAGE_KEY) && writeMistakeList(storageKey, []))
    if (!saved) return false

    setList([])
    notifyMistakeNotebook(storageKey)
    return true
  }, [storageKey])

  return { list, byId, recordWrong, remove, clear }
}
