"use client"

import {
  applySrsResult,
  createSrsState,
  normalizeSrsState,
  type SrsMap,
  type SrsResult,
  type SrsState,
} from "@/lib/srs-model"

export const SRS_EVENT = "yasashi:srs:update"

export function readSrsMap(storageKey: string): SrsMap {
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
    if (process.env.NODE_ENV === "development") {
      console.warn("[srs-storage] Failed to read from localStorage:", e)
    }
    return {}
  }
}

export function writeSrsMap(storageKey: string, map: SrsMap): boolean {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(map))
    return true
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[srs-storage] Failed to write to localStorage:", e)
    }
    return false
  }
}

export function notifySrs(storageKey: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(SRS_EVENT, { detail: { storageKey } }))
}

export function enrollSrs(storageKey: string, id: string, now: number = Date.now()) {
  if (typeof window === "undefined") return false
  const map = readSrsMap(storageKey)
  if (map[id]) return true
  map[id] = createSrsState(now)
  if (!writeSrsMap(storageKey, map)) return false
  notifySrs(storageKey)
  return true
}

export function gradeSrs(storageKey: string, id: string, result: SrsResult, now: number = Date.now()) {
  if (typeof window === "undefined") return false
  const map = readSrsMap(storageKey)
  const state = map[id] ? normalizeSrsState(map[id], now) : createSrsState(now)
  map[id] = applySrsResult(state, result, now)
  if (!writeSrsMap(storageKey, map)) return false
  notifySrs(storageKey)
  return true
}

export function setSrsState(storageKey: string, id: string, state: SrsState) {
  if (typeof window === "undefined") return false
  const map = readSrsMap(storageKey)
  map[id] = normalizeSrsState(state, Date.now())
  if (!writeSrsMap(storageKey, map)) return false
  notifySrs(storageKey)
  return true
}

export function removeSrs(storageKey: string, id: string) {
  if (typeof window === "undefined") return false
  const map = readSrsMap(storageKey)
  if (!map[id]) return true
  delete map[id]
  if (!writeSrsMap(storageKey, map)) return false
  notifySrs(storageKey)
  return true
}

export function clearSrs(storageKey: string) {
  if (typeof window === "undefined") return false
  if (!writeSrsMap(storageKey, {})) return false
  notifySrs(storageKey)
  return true
}
