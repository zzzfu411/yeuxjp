import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT, queueLearningNotification } from "@/lib/learning-store"
import { createSrsState, isDue, type SrsMap, type SrsResult } from "@/lib/srs-model"
import {
  canStoreSrsId,
  filterSrsMapForStorage,
  gradeExistingSrs,
  gradeSrs,
  hasSrs,
  notifySrs,
  readSrsMap,
  readSrsMapResult,
  SRS_EVENT,
  writeSrsMap,
} from "@/lib/srs-storage"

export {
  applySrsResult,
  createSrsState,
  getNextSrsDueAt,
  isDue,
  normalizeSrsState,
  sortSrsIdsByDue,
  type SrsMap,
  type SrsResult,
  type SrsState,
} from "@/lib/srs-model"
export { clearSrs, enrollSrs, gradeExistingSrs, gradeSrs, hasSrs, removeSrs, setSrsState, SRS_EVENT } from "@/lib/srs-storage"

export function useSrsDeck(storageKey: string) {
  const [map, setMap] = useState<SrsMap>(() => ({}))
  const [now, setNow] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const refreshDeck = useCallback(() => {
    setMap(readSrsMap(storageKey))
    setNow(Date.now())
    setLoaded(true)
  }, [storageKey])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      refreshDeck()
    })

    const interval = window.setInterval(() => setNow(Date.now()), 30 * 1000)

    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return
      refreshDeck()
    }

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as { storageKey?: string } | undefined
      if (detail?.storageKey !== storageKey) return
      refreshDeck()
    }

    const onLearningStore = (e: Event) => {
      const detail = (e as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(storageKey)) return
      refreshDeck()
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(SRS_EVENT, onCustom)
    window.addEventListener(LEARNING_STORE_EVENT, onLearningStore)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(SRS_EVENT, onCustom)
      window.removeEventListener(LEARNING_STORE_EVENT, onLearningStore)
    }
  }, [refreshDeck, storageKey])

  const dueIds = useMemo(() => {
    return Object.entries(map)
      .filter(([, s]) => isDue(s, now))
      .sort((a, b) => a[1].dueAt - b[1].dueAt)
      .map(([id]) => id)
  }, [map, now])

  const enroll = useCallback(
    (id: string) => {
      if (!canStoreSrsId(storageKey, id)) return true
      const current = readSrsMapResult(storageKey)
      if (!current.ok) return false
      if (current.value[id]) {
        queueLearningNotification(() => {
          setMap(current.value)
          setNow(Date.now())
        })
        return true
      }
      const now = Date.now()
      const next = { ...current.value, [id]: createSrsState(now) }
      if (!writeSrsMap(storageKey, next, { expectedRaw: current.raw })) return false
      notifySrs(storageKey)
      queueLearningNotification(() => {
        setMap(filterSrsMapForStorage(storageKey, next))
        setNow(now)
      })
      return true
    },
    [storageKey]
  )

  const remove = useCallback(
    (id: string) => {
      const current = readSrsMapResult(storageKey)
      if (!current.ok) return false
      if (!current.value[id]) {
        queueLearningNotification(() => {
          setMap(current.value)
          setNow(Date.now())
        })
        return true
      }
      const next = { ...current.value }
      delete next[id]
      if (!writeSrsMap(storageKey, next, { expectedRaw: current.raw })) return false
      notifySrs(storageKey)
      queueLearningNotification(() => {
        setMap(next)
        setNow(Date.now())
      })
      return true
    },
    [storageKey]
  )

  const grade = useCallback(
    (id: string, result: SrsResult) => {
      if (!gradeSrs(storageKey, id, result)) return false
      queueLearningNotification(refreshDeck)
      return true
    },
    [refreshDeck, storageKey]
  )

  const gradeExisting = useCallback(
    (id: string, result: SrsResult) => {
      if (!gradeExistingSrs(storageKey, id, result)) return false
      queueLearningNotification(refreshDeck)
      return true
    },
    [refreshDeck, storageKey]
  )

  const has = useCallback((id: string) => hasSrs(storageKey, id), [storageKey])

  const clear = useCallback(() => {
    if (!writeSrsMap(storageKey, {}, { replaceInvalid: true })) return false
    notifySrs(storageKey)
    queueLearningNotification(() => {
      setMap({})
      setNow(Date.now())
    })
    return true
  }, [storageKey])

  return { map, dueIds, loaded, enroll, remove, grade, gradeExisting, has, clear }
}
