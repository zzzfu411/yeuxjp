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
