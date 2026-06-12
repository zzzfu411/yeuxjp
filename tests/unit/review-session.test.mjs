import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const session = await loadTsModule("src/lib/review-session.ts")

test("review queues remove correct answers and requeue wrong answers", () => {
  assert.deepEqual(session.advanceReviewQueue(["a", "b", "c"], true), ["b", "c"])
  assert.deepEqual(session.advanceReviewQueue(["a", "b", "c"], false), ["b", "c", "a"])
})

test("review queues do not advance before an answer is graded", () => {
  const queue = ["a", "b"]
  assert.deepEqual(session.advanceReviewQueue(queue, null), queue)
  assert.deepEqual(session.advanceReviewQueue([], true), [])
})

test("review stats accumulate answers and completion display data", () => {
  let stats = session.createReviewStats()
  stats = session.recordReviewAnswer(stats, true)
  stats = session.recordReviewAnswer(stats, false)
  stats = session.recordReviewAnswer(stats, false)

  assert.deepEqual(stats, { correct: 1, wrong: 2, repeated: 2 })
  assert.deepEqual(session.getReviewCompletionStats(5, stats), {
    initial: 5,
    answered: 3,
    correct: 1,
    repeated: 2,
  })
})

test("review sessions are invalidated only by learning data replacement actions", () => {
  assert.equal(session.shouldInvalidateReviewSession("restore"), true)
  assert.equal(session.shouldInvalidateReviewSession("reset"), true)
  assert.equal(session.shouldInvalidateReviewSession("backup"), false)
  assert.equal(session.shouldInvalidateReviewSession("rollback"), false)
  assert.equal(session.shouldInvalidateReviewSession(undefined), false)
})
