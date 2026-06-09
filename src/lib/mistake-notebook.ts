"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { removeSrs, setSrsState, clearSrs } from "@/lib/srs"
import { applySrsResult, createSrsState } from "@/lib/srs-model"
import { buildMistakeId, removeMistakeById, upsertWrongMistake, type MistakeItem, type RecordMistakeInput } from "@/lib/mistake-notebook-model"
import { readMistakeList, writeMistakeList } from "@/lib/mistake-notebook-storage"
import { STORAGE_KEYS } from "@/lib/storage-keys"

export type { MistakeItem, MistakeMeta, MistakeOption, RecordMistakeInput } from "@/lib/mistake-notebook-model"

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.MISTAKES
export const MISTAKE_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_MISTAKES

export function useMistakeNotebook(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [list, setList] = useState<MistakeItem[]>(() => [])
  const listRef = useRef<MistakeItem[]>([])

  useEffect(() => {
    let cancelled = false

    const sync = () => {
      const next = readMistakeList(storageKey)
      listRef.current = next
      setList(next)
    }

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
      const next = upsertWrongMistake(listRef.current, input, now)

      if (!writeMistakeList(storageKey, next)) return

      listRef.current = next
      setList(next)

      // Mistakes should be reviewable soon, but only after the mistake record is durable.
      setSrsState(MISTAKE_SRS_STORAGE_KEY, id, applySrsResult(createSrsState(now), "again", now))
    },
    [storageKey]
  )

  const remove = useCallback(
    (id: string) => {
      const next = removeMistakeById(listRef.current, id)
      if (next === listRef.current) return
      if (!writeMistakeList(storageKey, next)) return

      listRef.current = [...next]
      setList([...next])
      removeSrs(MISTAKE_SRS_STORAGE_KEY, id)
    },
    [storageKey]
  )

  const clear = useCallback(() => {
    if (!writeMistakeList(storageKey, [])) return

    listRef.current = []
    setList([])
    clearSrs(MISTAKE_SRS_STORAGE_KEY)
  }, [storageKey])

  return { list, byId, recordWrong, remove, clear }
}
