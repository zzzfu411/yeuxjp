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

  const createdAt = finiteNumber(obj.createdAt) ?? now
  const lastReviewedAt = finiteNumber(obj.lastReviewedAt) ?? undefined

  const box = clampBox(finiteNumber(obj.box) ?? 1)
  const dueAt = finiteNumber(obj.dueAt) ?? nextDueAt(box, now)

  const rightValue = finiteNumber(obj.right)
  const wrongValue = finiteNumber(obj.wrong)
  const right = rightValue === null ? 0 : Math.max(0, Math.floor(rightValue))
  const wrong = wrongValue === null ? 0 : Math.max(0, Math.floor(wrongValue))

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
