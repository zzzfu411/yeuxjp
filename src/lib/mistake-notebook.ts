"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { removeSrs, setSrsState, clearSrs } from "@/lib/srs"
import { notifySrs, readSrsMap, writeSrsMap } from "@/lib/srs-storage"
import { applySrsResult, createSrsState } from "@/lib/srs-model"
import { buildMistakeId, removeMistakeById, upsertWrongMistake, type MistakeItem, type RecordMistakeInput } from "@/lib/mistake-notebook-model"
import { readMistakeList, writeMistakeList } from "@/lib/mistake-notebook-storage"
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

    window.addEventListener("storage", onStorage)
    window.addEventListener(LEARNING_STORE_EVENT, onLearningStore)

    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
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
      const previousSrs = readSrsMap(MISTAKE_SRS_STORAGE_KEY)

      if (!setSrsState(MISTAKE_SRS_STORAGE_KEY, id, applySrsResult(createSrsState(now), "again", now))) return
      if (!writeMistakeList(storageKey, next)) {
        if (writeSrsMap(MISTAKE_SRS_STORAGE_KEY, previousSrs)) notifySrs(MISTAKE_SRS_STORAGE_KEY)
        return
      }

      setList(next)
    },
    [storageKey]
  )

  const remove = useCallback(
    (id: string) => {
      const previous = readMistakeList(storageKey)
      const next = removeMistakeById(previous, id)
      if (next === previous) {
        setList(previous)
        removeSrs(MISTAKE_SRS_STORAGE_KEY, id)
        return
      }
      const previousSrs = readSrsMap(MISTAKE_SRS_STORAGE_KEY)
      if (!removeSrs(MISTAKE_SRS_STORAGE_KEY, id)) return
      if (!writeMistakeList(storageKey, next)) {
        if (writeSrsMap(MISTAKE_SRS_STORAGE_KEY, previousSrs)) notifySrs(MISTAKE_SRS_STORAGE_KEY)
        return
      }

      setList([...next])
    },
    [storageKey]
  )

  const clear = useCallback(() => {
    const previousSrs = readSrsMap(MISTAKE_SRS_STORAGE_KEY)
    if (!clearSrs(MISTAKE_SRS_STORAGE_KEY)) return
    if (!writeMistakeList(storageKey, [])) {
      if (writeSrsMap(MISTAKE_SRS_STORAGE_KEY, previousSrs)) notifySrs(MISTAKE_SRS_STORAGE_KEY)
      return
    }

    setList([])
  }, [storageKey])

  return { list, byId, recordWrong, remove, clear }
}
