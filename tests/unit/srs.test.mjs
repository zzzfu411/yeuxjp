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

test("hard answers shorten advanced intervals without counting as right or wrong", () => {
  const now = 1_700_000_000_000
  const advanced = { ...srs.createSrsState(now), box: 4, right: 3, wrong: 1 }
  const hard = srs.applySrsResult(advanced, "hard", now + 2_000)
  const beginnerHard = srs.applySrsResult(srs.createSrsState(now), "hard", now + 3_000)

  assert.equal(hard.box, 3)
  assert.equal(hard.dueAt, now + 2_000 + 3 * 24 * 60 * 60 * 1000)
  assert.equal(hard.lastReviewedAt, now + 2_000)
  assert.equal(hard.right, 3)
  assert.equal(hard.wrong, 1)
  assert.equal(beginnerHard.box, 1)
  assert.equal(beginnerHard.dueAt, now + 3_000 + 10 * 60 * 1000)
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

test("SRS timestamps stay finite when inputs and system clock are invalid", () => {
  const originalDateNow = Date.now
  Date.now = () => Number.NaN
  try {
    const created = srs.createSrsState(Number.NaN)
    assert.equal(created.createdAt, 0)
    assert.equal(created.dueAt, 10 * 60 * 1000)

    const normalized = srs.normalizeSrsState({ box: 1, dueAt: Number.NaN, createdAt: Number.NaN }, Number.NaN)
    assert.equal(normalized.createdAt, 0)
    assert.equal(normalized.dueAt, 10 * 60 * 1000)

    const reviewed = srs.applySrsResult(
      {
        box: Number.NaN,
        dueAt: Number.NaN,
        createdAt: Number.NaN,
        right: Number.NaN,
        wrong: Number.NaN,
      },
      "good",
      Number.NaN
    )
    assert.equal(reviewed.createdAt, 0)
    assert.equal(reviewed.lastReviewedAt, 0)
    assert.equal(reviewed.dueAt, 24 * 60 * 60 * 1000)
    assert.equal(reviewed.right, 1)
    assert.equal(reviewed.wrong, 0)
  } finally {
    Date.now = originalDateNow
  }
})

test("sortSrsIdsByDue orders queued ids by due time", () => {
  const map = {
    late: { ...srs.createSrsState(1_700_000_000_000), dueAt: 1_700_000_003_000 },
    early: { ...srs.createSrsState(1_700_000_000_000), dueAt: 1_700_000_001_000 },
    missing: undefined,
  }

  assert.deepEqual(srs.sortSrsIdsByDue(["missing", "late", "early"], map), ["early", "late", "missing"])
  assert.deepEqual(srs.sortSrsIdsByDue(["broken", "early"], { ...map, broken: { ...map.early, dueAt: Number.NaN } }), [
    "early",
    "broken",
  ])
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
