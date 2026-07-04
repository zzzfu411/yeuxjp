import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const srs = await loadTsModule("src/lib/srs.ts")

test("createSrsState starts in box 1 and is due in ten minutes", () => {
  const now = 1_700_000_000_000
  const state = srs.createSrsState(now)

  assert.equal(state.box, 1)
  assert.equal(state.dueAt, now + 10 * 60 * 1000)
  assert.equal(state.right, 0)
  assert.equal(state.wrong, 0)
})

test("good answers advance the box and wrong answers reset to immediate review", () => {
  const now = 1_700_000_000_000
  const initial = srs.createSrsState(now)
  const good = srs.applySrsResult(initial, "good", now)
  const again = srs.applySrsResult(good, "again", now + 1_000)

  assert.equal(good.box, 2)
  assert.equal(good.right, 1)
  assert.equal(good.dueAt, now + 24 * 60 * 60 * 1000)
  assert.equal(again.box, 0)
  assert.equal(again.wrong, 1)
  assert.equal(again.dueAt, now + 1_000)
})

test("normalizeSrsState clamps invalid persisted values", () => {
  const now = 1_700_000_000_000
  const state = srs.normalizeSrsState({ box: 99, right: -1, wrong: 1.8 }, now)

  assert.equal(state.box, 6)
  assert.equal(state.right, 0)
  assert.equal(state.wrong, 1)
})

test("normalizeSrsState rejects non-finite persisted numbers", () => {
  const now = 1_700_000_000_000
  const state = srs.normalizeSrsState(
    {
      box: Number.POSITIVE_INFINITY,
      dueAt: Number.NaN,
      createdAt: Number.NEGATIVE_INFINITY,
      lastReviewedAt: Number.POSITIVE_INFINITY,
      right: Number.POSITIVE_INFINITY,
      wrong: Number.NaN,
    },
    now
  )

  assert.equal(state.box, 1)
  assert.equal(state.dueAt, now + 10 * 60 * 1000)
  assert.equal(state.createdAt, now)
  assert.equal(state.lastReviewedAt, undefined)
  assert.equal(state.right, 0)
  assert.equal(state.wrong, 0)
})

test("sortSrsIdsByDue orders queued ids by due time", () => {
  const map = {
    late: { ...srs.createSrsState(1_700_000_000_000), dueAt: 1_700_000_003_000 },
    early: { ...srs.createSrsState(1_700_000_000_000), dueAt: 1_700_000_001_000 },
    missing: undefined,
  }

  assert.deepEqual(srs.sortSrsIdsByDue(["missing", "late", "early"], map), ["early", "late", "missing"])
})

test("getNextSrsDueAt ignores due items and returns the soonest future review", () => {
  const now = 1_700_000_000_000
  const next = srs.getNextSrsDueAt(
    [
      {
        due: { ...srs.createSrsState(now), dueAt: now - 1 },
        later: { ...srs.createSrsState(now), dueAt: now + 10_000 },
      },
      {
        soon: { ...srs.createSrsState(now), dueAt: now + 2_000 },
      },
    ],
    now
  )

  assert.equal(next, now + 2_000)
  assert.equal(srs.getNextSrsDueAt([{ due: { ...srs.createSrsState(now), dueAt: now } }], now), null)
})

test("getNextSrsDueAt normalizes non-finite due dates before scheduling", () => {
  const now = 1_700_000_000_000
  const next = srs.getNextSrsDueAt(
    [
      {
        broken: { ...srs.createSrsState(now), dueAt: Number.NaN },
      },
    ],
    now
  )

  assert.equal(next, now + 10 * 60 * 1000)
})
