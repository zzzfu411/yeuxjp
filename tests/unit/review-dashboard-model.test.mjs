import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/review-dashboard-model.ts")

test("review dashboard count formatting clamps empty values and abbreviates large queues", () => {
  assert.equal(model.formatReviewDueCount(0), "0")
  assert.equal(model.formatReviewDueCount(-8), "0")
  assert.equal(model.formatReviewDueCount(Number.NaN), "0")
  assert.equal(model.formatReviewDueCount(Number.POSITIVE_INFINITY), "0")
  assert.equal(model.formatReviewDueCount(42), "42")
  assert.equal(model.formatReviewDueCount(42.8), "42")
  assert.equal(model.formatReviewDueCount(999), "999")
  assert.equal(model.formatReviewDueCount(1000), "1k")
  assert.equal(model.formatReviewDueCount(1250), "1.2k")
  assert.equal(model.formatReviewDueCount(10_000), "10k")
})

test("review dashboard next due formatting reports empty, due, and future schedules", () => {
  const now = 1_700_000_000_000
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  assert.equal(model.formatReviewNextDueAt(null, now), "\u6682\u65e0\u6392\u7a0b")
  assert.equal(model.formatReviewNextDueAt(Number.NaN, now), "\u6682\u65e0\u6392\u7a0b")
  assert.equal(model.formatReviewNextDueAt(Number.POSITIVE_INFINITY, now), "\u6682\u65e0\u6392\u7a0b")
  assert.equal(model.formatReviewNextDueAt(now + minute, Number.NaN), "\u6682\u65e0\u6392\u7a0b")
  assert.equal(model.formatReviewNextDueAt(0, now), "\u73b0\u5728")
  assert.equal(model.formatReviewNextDueAt(now, now), "\u73b0\u5728")
  assert.equal(model.formatReviewNextDueAt(now - 1, now), "\u73b0\u5728")
  assert.equal(model.formatReviewNextDueAt(now + minute, now), "1 \u5206\u949f\u540e")
  assert.equal(model.formatReviewNextDueAt(now + 2 * hour, now), "2 \u5c0f\u65f6\u540e")
  assert.equal(model.formatReviewNextDueAt(now + 3 * day, now), "3 \u5929\u540e")
})

test("review dashboard model filters visible due ids and builds the today queue", () => {
  const now = 1_700_000_000_000
  const state = (dueAt) => ({ dueAt, box: 1, createdAt: now - 1, right: 0, wrong: 0 })

  const dashboard = model.buildReviewDashboardModel({
    masteredIds: new Set(["a", "ka", "ta"]),
    learnedIds: new Set(["sur-g-1", "sur-g-2"]),
    mistakeIds: ["m1", "m2"],
    kanaSrsMap: {
      a: state(now - 20),
      ka: state(now - 10),
      "sokuon:kitte": state(now - 100),
    },
    kanaDueIds: ["sokuon:kitte", "ka", "a"],
    vocabSrsMap: {
      "sur-g-1": state(now - 30),
      "sur-g-999": state(now + 120_000),
    },
    vocabDueIds: ["sur-g-1"],
    mistakeSrsMap: {
      m1: state(now + 60_000),
      m2: state(now - 5),
      ghost: state(now + 1_000),
    },
    mistakeDueIds: ["ghost", "m2"],
    now,
  })

  assert.deepEqual(dashboard.dueMistakeIds, ["m2"])
  assert.deepEqual(dashboard.reviewableKanaDueIds, ["ka", "a"])
  assert.deepEqual(dashboard.kanaEnrollMissing, ["ta"])
  assert.deepEqual(dashboard.vocabEnrollMissing, ["sur-g-2"])
  assert.deepEqual(dashboard.mistakeEnrollMissing, [])
  assert.deepEqual(dashboard.todayQueue, [
    { deck: "mistakes", id: "m2" },
    { deck: "vocab", id: "sur-g-1" },
    { deck: "kana", id: "a" },
    { deck: "kana", id: "ka" },
  ])
  assert.equal(dashboard.totalEnrolled, 5)
  assert.equal(dashboard.totalDue, 4)
  assert.equal(dashboard.isFirstTime, false)
  assert.equal(dashboard.nextDueAt, now + 60_000)
  assert.deepEqual(dashboard.counts, { mistakesDue: 1, kanaDue: 2, vocabDue: 1 })
  assert.deepEqual(dashboard.totals, { kana: 2, vocab: 1, mistakes: 2, mastered: 3, learned: 2 })
})

test("review dashboard model reports first-time state and empty next due schedule", () => {
  const dashboard = model.buildReviewDashboardModel({
    masteredIds: [],
    learnedIds: [],
    mistakeIds: [],
    kanaSrsMap: {},
    kanaDueIds: [],
    vocabSrsMap: {},
    vocabDueIds: [],
    mistakeSrsMap: {},
    mistakeDueIds: [],
  })

  assert.equal(dashboard.isFirstTime, true)
  assert.equal(dashboard.totalEnrolled, 0)
  assert.equal(dashboard.totalDue, 0)
  assert.equal(dashboard.nextDueAt, null)
  assert.deepEqual(dashboard.todayQueue, [])
})

test("review dashboard ignores legacy non-reviewable kana SRS when reporting availability", () => {
  const now = 1_700_000_000_000
  const state = (dueAt) => ({ dueAt, box: 1, createdAt: now - 1, right: 0, wrong: 0 })

  const dashboard = model.buildReviewDashboardModel({
    masteredIds: [],
    learnedIds: [],
    mistakeIds: [],
    kanaSrsMap: {
      "sokuon:kitte": state(now - 100),
      "longvowel:obaasan": state(now + 10_000),
    },
    kanaDueIds: ["sokuon:kitte"],
    vocabSrsMap: {},
    vocabDueIds: [],
    mistakeSrsMap: {},
    mistakeDueIds: [],
    now,
  })

  assert.equal(dashboard.totals.kana, 0)
  assert.equal(dashboard.totals.mastered, 0)
  assert.equal(dashboard.totalEnrolled, 0)
  assert.equal(dashboard.totalDue, 0)
  assert.equal(dashboard.isFirstTime, true)
  assert.equal(dashboard.nextDueAt, null)
  assert.deepEqual(dashboard.reviewableKanaDueIds, [])
  assert.deepEqual(dashboard.todayQueue, [])
})

test("review dashboard ignores stale vocabulary SRS that is no longer learned", () => {
  const now = 1_700_000_000_000
  const state = (dueAt) => ({ dueAt, box: 1, createdAt: now - 1, right: 0, wrong: 0 })

  const dashboard = model.buildReviewDashboardModel({
    masteredIds: [],
    learnedIds: ["sur-g-1"],
    mistakeIds: [],
    kanaSrsMap: {},
    kanaDueIds: [],
    vocabSrsMap: {
      "sur-g-1": state(now + 60_000),
      stale: state(now - 10),
    },
    vocabDueIds: ["stale"],
    mistakeSrsMap: {},
    mistakeDueIds: [],
    now,
  })

  assert.deepEqual(dashboard.vocabDueIds, [])
  assert.deepEqual(dashboard.todayQueue, [])
  assert.equal(dashboard.counts.vocabDue, 0)
  assert.equal(dashboard.totals.vocab, 1)
  assert.equal(dashboard.totalEnrolled, 1)
  assert.equal(dashboard.totalDue, 0)
  assert.equal(dashboard.nextDueAt, now + 60_000)
})

test("review dashboard keeps SRS items that have practice progress before mastery thresholds", () => {
  const now = 1_700_000_000_000
  const state = (dueAt) => ({ dueAt, box: 1, createdAt: now - 1, right: 0, wrong: 0 })

  const dashboard = model.buildReviewDashboardModel({
    masteredIds: [],
    learnedIds: [],
    items: {
      a: {
        itemId: "a",
        itemType: "kana",
        recognition: 18,
        listening: 0,
        meaning: 0,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: now,
      },
      "sur-g-1": {
        itemId: "sur-g-1",
        itemType: "vocab",
        recognition: 0,
        listening: 0,
        meaning: 18,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: now,
      },
    },
    mistakeIds: [],
    kanaSrsMap: { a: state(now - 20) },
    kanaDueIds: ["a"],
    vocabSrsMap: { "sur-g-1": state(now - 10) },
    vocabDueIds: ["sur-g-1"],
    mistakeSrsMap: {},
    mistakeDueIds: [],
    now,
  })

  assert.deepEqual(dashboard.reviewableKanaDueIds, ["a"])
  assert.deepEqual(dashboard.vocabDueIds, ["sur-g-1"])
  assert.deepEqual(dashboard.todayQueue, [
    { deck: "kana", id: "a" },
    { deck: "vocab", id: "sur-g-1" },
  ])
  assert.equal(dashboard.counts.kanaDue, 1)
  assert.equal(dashboard.counts.vocabDue, 1)
  assert.equal(dashboard.totalDue, 2)
})

test("review dashboard offers enrollment for practiced items missing SRS records", () => {
  const now = 1_700_000_000_000

  const dashboard = model.buildReviewDashboardModel({
    masteredIds: [],
    learnedIds: [],
    items: {
      a: {
        itemId: "a",
        itemType: "kana",
        recognition: 18,
        listening: 0,
        meaning: 0,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: now,
      },
      "sur-g-1": {
        itemId: "sur-g-1",
        itemType: "vocab",
        recognition: 0,
        listening: 0,
        meaning: 18,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: now,
      },
    },
    mistakeIds: [],
    kanaSrsMap: {},
    kanaDueIds: [],
    vocabSrsMap: {},
    vocabDueIds: [],
    mistakeSrsMap: {},
    mistakeDueIds: [],
    now,
  })

  assert.deepEqual(dashboard.kanaEnrollMissing, ["a"])
  assert.deepEqual(dashboard.vocabEnrollMissing, ["sur-g-1"])
  assert.equal(dashboard.isFirstTime, false)
  assert.equal(dashboard.totalEnrolled, 0)
  assert.equal(dashboard.totalDue, 0)
})

test("review dashboard offers enrollment for notebook mistakes missing SRS records", () => {
  const now = 1_700_000_000_000

  const dashboard = model.buildReviewDashboardModel({
    masteredIds: [],
    learnedIds: [],
    mistakeIds: ["m1", "m2"],
    kanaSrsMap: {},
    kanaDueIds: [],
    vocabSrsMap: {},
    vocabDueIds: [],
    mistakeSrsMap: {
      m2: { dueAt: now + 60_000, box: 1, createdAt: now - 1, right: 0, wrong: 0 },
    },
    mistakeDueIds: [],
    now,
  })

  assert.deepEqual(dashboard.mistakeEnrollMissing, ["m1"])
  assert.equal(dashboard.totals.mistakes, 2)
  assert.equal(dashboard.counts.mistakesDue, 0)
  assert.equal(dashboard.totalDue, 0)
  assert.equal(dashboard.nextDueAt, now + 60_000)
})

test("review dashboard does not enroll non-reviewable kana practice items", () => {
  const now = 1_700_000_000_000

  const dashboard = model.buildReviewDashboardModel({
    masteredIds: ["sokuon:kitte"],
    learnedIds: [],
    items: {
      "sokuon:kitte": {
        itemId: "sokuon:kitte",
        itemType: "kana",
        recognition: 18,
        listening: 0,
        meaning: 0,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: now,
      },
    },
    mistakeIds: [],
    kanaSrsMap: {},
    kanaDueIds: [],
    vocabSrsMap: {},
    vocabDueIds: [],
    mistakeSrsMap: {},
    mistakeDueIds: [],
    now,
  })

  assert.deepEqual(dashboard.kanaEnrollMissing, [])
  assert.equal(dashboard.isFirstTime, true)
  assert.equal(dashboard.totalEnrolled, 0)
  assert.equal(dashboard.totals.mastered, 0)
})

test("review dashboard ignores vocabulary ids that are no longer in the current vocabulary data", () => {
  const now = 1_700_000_000_000
  const state = (dueAt) => ({ dueAt, box: 1, createdAt: now - 1, right: 0, wrong: 0 })

  const dashboard = model.buildReviewDashboardModel({
    masteredIds: [],
    learnedIds: ["sur-g-999"],
    items: {
      "sur-g-999": {
        itemId: "sur-g-999",
        itemType: "vocab",
        recognition: 0,
        listening: 0,
        meaning: 18,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: now,
      },
    },
    mistakeIds: [],
    kanaSrsMap: {},
    kanaDueIds: [],
    vocabSrsMap: { "sur-g-999": state(now - 10) },
    vocabDueIds: ["sur-g-999"],
    mistakeSrsMap: {},
    mistakeDueIds: [],
    now,
  })

  assert.deepEqual(dashboard.vocabDueIds, [])
  assert.deepEqual(dashboard.vocabEnrollMissing, [])
  assert.deepEqual(dashboard.todayQueue, [])
  assert.equal(dashboard.totals.vocab, 0)
  assert.equal(dashboard.totals.learned, 0)
  assert.equal(dashboard.totalDue, 0)
})

test("review enrollment helper attempts every missing item and reports any failure", () => {
  const attempted = []
  const ok = model.enrollMissingReviewItems(["a", "ka", "sa"], (id) => {
    attempted.push(id)
    return id !== "ka"
  })

  assert.deepEqual(attempted, ["a", "ka", "sa"])
  assert.equal(ok, false)
  assert.equal(model.enrollMissingReviewItems([], () => false), true)
})
