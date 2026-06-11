import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/review-dashboard-model.ts")

test("review dashboard count formatting clamps empty values and abbreviates large queues", () => {
  assert.equal(model.formatReviewDueCount(0), "0")
  assert.equal(model.formatReviewDueCount(-8), "0")
  assert.equal(model.formatReviewDueCount(42), "42")
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
    learnedIds: new Set(["v1", "v2"]),
    mistakeIds: ["m1", "m2"],
    kanaSrsMap: {
      a: state(now - 20),
      ka: state(now - 10),
      "sokuon:kitte": state(now - 100),
    },
    kanaDueIds: ["sokuon:kitte", "ka", "a"],
    vocabSrsMap: {
      v1: state(now - 30),
      v3: state(now + 120_000),
    },
    vocabDueIds: ["v1"],
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
  assert.deepEqual(dashboard.vocabEnrollMissing, ["v2"])
  assert.deepEqual(dashboard.todayQueue, [
    { deck: "mistakes", id: "m2" },
    { deck: "kana", id: "a" },
    { deck: "kana", id: "ka" },
    { deck: "vocab", id: "v1" },
  ])
  assert.equal(dashboard.totalEnrolled, 6)
  assert.equal(dashboard.totalDue, 4)
  assert.equal(dashboard.isFirstTime, false)
  assert.equal(dashboard.nextDueAt, now + 60_000)
  assert.deepEqual(dashboard.counts, { mistakesDue: 1, kanaDue: 2, vocabDue: 1 })
  assert.deepEqual(dashboard.totals, { kana: 2, vocab: 2, mistakes: 2, mastered: 3, learned: 2 })
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
  assert.equal(dashboard.totalEnrolled, 0)
  assert.equal(dashboard.totalDue, 0)
  assert.equal(dashboard.isFirstTime, true)
  assert.equal(dashboard.nextDueAt, null)
  assert.deepEqual(dashboard.reviewableKanaDueIds, [])
  assert.deepEqual(dashboard.todayQueue, [])
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
