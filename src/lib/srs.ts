import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"

export type SrsState = {
  box: number
  dueAt: number
  createdAt: number
  lastReviewedAt?: number
  right: number
  wrong: number
}

const BOX_INTERVAL_MS = [
  0, // again (immediate)
  10 * 60 * 1000, // 10m
  24 * 60 * 60 * 1000, // 1d
  3 * 24 * 60 * 60 * 1000, // 3d
  7 * 24 * 60 * 60 * 1000, // 7d
  14 * 24 * 60 * 60 * 1000, // 14d
  30 * 24 * 60 * 60 * 1000, // 30d
] as const

const MAX_BOX = BOX_INTERVAL_MS.length - 1

export type SrsResult = "again" | "good"

function clampBox(box: number) {
  if (!Number.isFinite(box)) return 1
  return Math.max(0, Math.min(MAX_BOX, Math.floor(box)))
}

function nextDueAt(box: number, now: number) {
  const safeBox = clampBox(box)
  return now + BOX_INTERVAL_MS[safeBox]
}

export function createSrsState(now: number = Date.now()): SrsState {
  return {
    box: 1,
    dueAt: nextDueAt(1, now),
    createdAt: now,
    right: 0,
    wrong: 0,
  }
}

export function normalizeSrsState(input: unknown, now: number = Date.now()): SrsState {
  if (!input || typeof input !== "object") return createSrsState(now)
  const obj = input as Record<string, unknown>

  const createdAt = typeof obj.createdAt === "number" ? obj.createdAt : now
  const lastReviewedAt = typeof obj.lastReviewedAt === "number" ? obj.lastReviewedAt : undefined

  const box = clampBox(typeof obj.box === "number" ? obj.box : 1)
  const dueAt = typeof obj.dueAt === "number" ? obj.dueAt : nextDueAt(box, now)

  const right = typeof obj.right === "number" ? Math.max(0, Math.floor(obj.right)) : 0
  const wrong = typeof obj.wrong === "number" ? Math.max(0, Math.floor(obj.wrong)) : 0

  return { box, dueAt, createdAt, lastReviewedAt, right, wrong }
}

export function applySrsResult(state: SrsState, result: SrsResult, now: number = Date.now()): SrsState {
  if (result === "good") {
    const box = clampBox(state.box + 1)
    return {
      ...state,
      box,
      dueAt: nextDueAt(box, now),
      lastReviewedAt: now,
      right: state.right + 1,
    }
  }

  const box = 0
  return {
    ...state,
    box,
    dueAt: nextDueAt(box, now),
    lastReviewedAt: now,
    wrong: state.wrong + 1,
  }
}

export function isDue(state: SrsState, now: number = Date.now()) {
  return state.dueAt <= now
}

export type SrsMap = Record<string, SrsState>

export function sortSrsIdsByDue(ids: string[], map: SrsMap): string[] {
  return [...ids].sort((a, b) => (map[a]?.dueAt ?? Number.MAX_SAFE_INTEGER) - (map[b]?.dueAt ?? Number.MAX_SAFE_INTEGER))
}

export function getNextSrsDueAt(maps: SrsMap[], now: number = Date.now()): number | null {
  let next: number | null = null

  for (const map of maps) {
    for (const state of Object.values(map)) {
      const dueAt = normalizeSrsState(state, now).dueAt
      if (dueAt <= now) continue
      if (next === null || dueAt < next) next = dueAt
    }
  }

  return next
}

function readMap(storageKey: string): SrsMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    const obj = parsed as Record<string, unknown>

    const now = Date.now()
    const out: SrsMap = {}
    for (const [id, value] of Object.entries(obj)) {
      out[id] = normalizeSrsState(value, now)
    }
    return out
  } catch (e) {
    // 添加错误日志，帮助调试
    if (process.env.NODE_ENV === "development") {
      console.warn("[srs] Failed to read from localStorage:", e)
    }
    return {}
  }
}

function writeMap(storageKey: string, map: SrsMap): boolean {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(map))
    return true
  } catch (e) {
    // 添加错误日志
    if (process.env.NODE_ENV === "development") {
      console.warn("[srs] Failed to write to localStorage:", e)
    }
    return false
  }
}

function notify(storageKey: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("yasashi:srs:update", { detail: { storageKey } }))
}

export function enrollSrs(storageKey: string, id: string, now: number = Date.now()) {
  if (typeof window === "undefined") return
  const map = readMap(storageKey)
  if (map[id]) return
  map[id] = createSrsState(now)
  writeMap(storageKey, map)
  notify(storageKey)
}

export function setSrsState(storageKey: string, id: string, state: SrsState) {
  if (typeof window === "undefined") return
  const map = readMap(storageKey)
  map[id] = normalizeSrsState(state, Date.now())
  writeMap(storageKey, map)
  notify(storageKey)
}

export function removeSrs(storageKey: string, id: string) {
  if (typeof window === "undefined") return
  const map = readMap(storageKey)
  if (!map[id]) return
  delete map[id]
  writeMap(storageKey, map)
  notify(storageKey)
}

export function clearSrs(storageKey: string) {
  if (typeof window === "undefined") return
  writeMap(storageKey, {})
  notify(storageKey)
}

export function useSrsDeck(storageKey: string) {
  const [map, setMap] = useState<SrsMap>(() => ({}))
  const [now, setNow] = useState(0)

  useEffect(() => {
    let cancelled = false

    // 合并异步操作，避免竞态条件
    Promise.resolve().then(() => {
      if (cancelled) return
      setMap(readMap(storageKey))
      setNow(Date.now())
    })

    const interval = window.setInterval(() => setNow(Date.now()), 30 * 1000)

    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return
      setMap(readMap(storageKey))
    }

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as { storageKey?: string } | undefined
      if (detail?.storageKey !== storageKey) return
      setMap(readMap(storageKey))
    }

    const onLearningStore = (e: Event) => {
      const detail = (e as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(storageKey)) return
      setMap(readMap(storageKey))
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener("yasashi:srs:update", onCustom)
    window.addEventListener(LEARNING_STORE_EVENT, onLearningStore)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("yasashi:srs:update", onCustom)
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
      setMap((prev) => {
        if (prev[id]) return prev
        const now = Date.now()
        const next = { ...prev, [id]: createSrsState(now) }
        writeMap(storageKey, next)
        notify(storageKey)
        return next
      })
    },
    [storageKey]
  )

  const remove = useCallback(
    (id: string) => {
      setMap((prev) => {
        if (!prev[id]) return prev
        const next = { ...prev }
        delete next[id]
        writeMap(storageKey, next)
        notify(storageKey)
        return next
      })
    },
    [storageKey]
  )

  const grade = useCallback(
    (id: string, result: SrsResult) => {
      setMap((prev) => {
        const now = Date.now()
        const state = prev[id] ? normalizeSrsState(prev[id], now) : createSrsState(now)
        const nextState = applySrsResult(state, result, now)
        const next = { ...prev, [id]: nextState }
        writeMap(storageKey, next)
        notify(storageKey)
        return next
      })
    },
    [storageKey]
  )

  const clear = useCallback(() => {
    setMap(() => {
      writeMap(storageKey, {})
      notify(storageKey)
      return {}
    })
  }, [storageKey])

  return { map, dueIds, enroll, remove, grade, clear }
}
