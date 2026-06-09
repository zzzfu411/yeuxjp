import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { applySrsResult, createSrsState, isDue, normalizeSrsState, type SrsMap, type SrsResult } from "@/lib/srs-model"
import { notifySrs, readSrsMap, SRS_EVENT, writeSrsMap } from "@/lib/srs-storage"

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
export { clearSrs, enrollSrs, removeSrs, setSrsState, SRS_EVENT } from "@/lib/srs-storage"

export function useSrsDeck(storageKey: string) {
  const [map, setMap] = useState<SrsMap>(() => ({}))
  const [now, setNow] = useState(0)

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setMap(readSrsMap(storageKey))
      setNow(Date.now())
    })

    const interval = window.setInterval(() => setNow(Date.now()), 30 * 1000)

    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return
      setMap(readSrsMap(storageKey))
    }

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as { storageKey?: string } | undefined
      if (detail?.storageKey !== storageKey) return
      setMap(readSrsMap(storageKey))
    }

    const onLearningStore = (e: Event) => {
      const detail = (e as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(storageKey)) return
      setMap(readSrsMap(storageKey))
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
  }, [storageKey])

  const dueIds = useMemo(() => {
    return Object.entries(map)
      .filter(([, s]) => isDue(s, now))
      .sort((a, b) => a[1].dueAt - b[1].dueAt)
      .map(([id]) => id)
  }, [map, now])

  const enroll = useCallback(
    (id: string) => {
      setMap(() => {
        const previous = readSrsMap(storageKey)
        if (previous[id]) return previous
        const now = Date.now()
        const next = { ...previous, [id]: createSrsState(now) }
        if (!writeSrsMap(storageKey, next)) return previous
        notifySrs(storageKey)
        return next
      })
    },
    [storageKey]
  )

  const remove = useCallback(
    (id: string) => {
      setMap(() => {
        const previous = readSrsMap(storageKey)
        if (!previous[id]) return previous
        const next = { ...previous }
        delete next[id]
        if (!writeSrsMap(storageKey, next)) return previous
        notifySrs(storageKey)
        return next
      })
    },
    [storageKey]
  )

  const grade = useCallback(
    (id: string, result: SrsResult) => {
      setMap(() => {
        const now = Date.now()
        const previous = readSrsMap(storageKey)
        const state = previous[id] ? normalizeSrsState(previous[id], now) : createSrsState(now)
        const nextState = applySrsResult(state, result, now)
        const next = { ...previous, [id]: nextState }
        if (!writeSrsMap(storageKey, next)) return previous
        notifySrs(storageKey)
        return next
      })
    },
    [storageKey]
  )

  const clear = useCallback(() => {
    setMap(() => {
      const previous = readSrsMap(storageKey)
      if (!writeSrsMap(storageKey, {})) return previous
      notifySrs(storageKey)
      return {}
    })
  }, [storageKey])

  return { map, dueIds, enroll, remove, grade, clear }
}
