export type SrsState = {
  box: number
  dueAt: number
  createdAt: number
  lastReviewedAt?: number
  right: number
  wrong: number
}

const BOX_INTERVAL_MS = [
  0,
  10 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000,
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

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function safeTimestamp(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return Number.isFinite(fallback) ? fallback : 0
}

export function createSrsState(now: number = Date.now()): SrsState {
  const safeNow = safeTimestamp(now)
  return {
    box: 1,
    dueAt: nextDueAt(1, safeNow),
    createdAt: safeNow,
    right: 0,
    wrong: 0,
  }
}

export function normalizeSrsState(input: unknown, now: number = Date.now()): SrsState {
  const safeNow = safeTimestamp(now)
  if (!input || typeof input !== "object") return createSrsState(safeNow)
  const obj = input as Record<string, unknown>

  const createdAt = finiteNumber(obj.createdAt) ?? safeNow
  const lastReviewedAt = finiteNumber(obj.lastReviewedAt) ?? undefined

  const box = clampBox(finiteNumber(obj.box) ?? 1)
  const dueAt = finiteNumber(obj.dueAt) ?? nextDueAt(box, safeNow)

  const rightValue = finiteNumber(obj.right)
  const wrongValue = finiteNumber(obj.wrong)
  const right = rightValue === null ? 0 : Math.max(0, Math.floor(rightValue))
  const wrong = wrongValue === null ? 0 : Math.max(0, Math.floor(wrongValue))

  return { box, dueAt, createdAt, lastReviewedAt, right, wrong }
}

export function applySrsResult(state: SrsState, result: SrsResult, now: number = Date.now()): SrsState {
  const safeNow = safeTimestamp(now)
  const current = normalizeSrsState(state, safeNow)
  if (result === "good") {
    const box = clampBox(current.box + 1)
    return {
      ...current,
      box,
      dueAt: nextDueAt(box, safeNow),
      lastReviewedAt: safeNow,
      right: current.right + 1,
    }
  }

  const box = 0
  return {
    ...current,
    box,
    dueAt: nextDueAt(box, safeNow),
    lastReviewedAt: safeNow,
    wrong: current.wrong + 1,
  }
}

export function isDue(state: SrsState, now: number = Date.now()) {
  const safeNow = safeTimestamp(now)
  return normalizeSrsState(state, safeNow).dueAt <= safeNow
}

export type SrsMap = Record<string, SrsState>

export function sortSrsIdsByDue(ids: string[], map: SrsMap): string[] {
  const dueValue = (id: string) => finiteNumber(map[id]?.dueAt) ?? Number.MAX_SAFE_INTEGER
  return [...ids].sort((a, b) => dueValue(a) - dueValue(b))
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
