import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { createSrsState, isDue, type SrsMap, type SrsResult } from "@/lib/srs-model"
import { canStoreSrsId, filterSrsMapForStorage, gradeSrs, notifySrs, readSrsMap, SRS_EVENT, writeSrsMap } from "@/lib/srs-storage"

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
export { clearSrs, enrollSrs, gradeSrs, removeSrs, setSrsState, SRS_EVENT } from "@/lib/srs-storage"

export function useSrsDeck(storageKey: string) {
  const [map, setMap] = useState<SrsMap>(() => ({}))
  const [now, setNow] = useState(0)

  const refreshDeck = useCallback(() => {
    setMap(readSrsMap(storageKey))
    setNow(Date.now())
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
      const previous = readSrsMap(storageKey)
      if (previous[id]) {
        setMap(previous)
        setNow(Date.now())
        return true
      }
      const now = Date.now()
      const next = { ...previous, [id]: createSrsState(now) }
      if (!writeSrsMap(storageKey, next)) return false
      notifySrs(storageKey)
      setMap(filterSrsMapForStorage(storageKey, next))
      setNow(now)
      return true
    },
    [storageKey]
  )

  const remove = useCallback(
    (id: string) => {
      const previous = readSrsMap(storageKey)
      if (!previous[id]) {
        setMap(previous)
        setNow(Date.now())
        return true
      }
      const next = { ...previous }
      delete next[id]
      if (!writeSrsMap(storageKey, next)) return false
      notifySrs(storageKey)
      setMap(next)
      setNow(Date.now())
      return true
    },
    [storageKey]
  )

  const grade = useCallback(
    (id: string, result: SrsResult) => {
      if (!gradeSrs(storageKey, id, result)) return false
      refreshDeck()
      return true
    },
    [refreshDeck, storageKey]
  )

  const clear = useCallback(() => {
    if (!writeSrsMap(storageKey, {})) return false
    notifySrs(storageKey)
    setMap({})
    setNow(Date.now())
    return true
  }, [storageKey])

  return { map, dueIds, enroll, remove, grade, clear }
}
