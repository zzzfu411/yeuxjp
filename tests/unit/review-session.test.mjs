import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const session = await loadTsModule("src/lib/review-session.ts")

test("review queues remove correct answers and requeue wrong answers", () => {
  assert.deepEqual(session.advanceReviewQueue(["a", "b", "c"], true), ["b", "c"])
  assert.deepEqual(session.advanceReviewQueue(["a", "b", "c"], false), ["b", "c", "a"])
})

test("wrong-answer requeues produce a fresh queue snapshot", () => {
  const queue = ["a"]
  const next = session.advanceReviewQueue(queue, false)

  assert.deepEqual(next, ["a"])
  assert.notEqual(next, queue)
})

test("review queues do not advance before an answer is graded", () => {
  const queue = ["a", "b"]
  assert.deepEqual(session.advanceReviewQueue(queue, null), queue)
  assert.deepEqual(session.advanceReviewQueue([], true), [])
})

test("review queues can drop the current item after external removal", () => {
  const queue = ["a", "b", "c"]

  assert.deepEqual(session.dropCurrentReviewItem(queue), ["b", "c"])
  assert.deepEqual(session.dropCurrentReviewItem([]), [])
  assert.deepEqual(queue, ["a", "b", "c"])
})

test("review queues can defer the current item to the tail without dropping it", () => {
  const queue = ["vocab", "kana", "mistake"]

  assert.deepEqual(session.deferCurrentReviewItem(queue), ["kana", "mistake", "vocab"])
  assert.deepEqual(session.deferCurrentReviewItem(["vocab"]), ["vocab"])
  assert.deepEqual(session.deferCurrentReviewItem([]), [])
  assert.deepEqual(queue, ["vocab", "kana", "mistake"])
})

test("one-item defer cancels on a two-item queue, so vocab-pool defer must be idempotent", () => {
  const queue = ["vocab", "kana"]

  assert.deepEqual(
    session.deferCurrentReviewItem(session.deferCurrentReviewItem(queue)),
    queue
  )
  assert.equal(session.reviewQueuesEqual(["vocab", "kana"], ["vocab", "kana"]), true)
  assert.equal(session.reviewQueuesEqual(["vocab", "kana"], ["kana", "vocab"]), false)
  assert.equal(session.canDeferReviewItem({ answerPending: false }), true)
  assert.equal(session.canDeferReviewItem({ answerPending: true }), false)
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

test("review answer recording distinguishes duplicates from save failures", () => {
  assert.equal(session.canStartReviewAnswerRecording({
    selectedAnswer: null,
    answerPending: false,
  }), true)
  assert.equal(session.canStartReviewAnswerRecording({
    selectedAnswer: "a",
    answerPending: false,
  }), false)
  assert.equal(session.canStartReviewAnswerRecording({
    selectedAnswer: null,
    answerPending: true,
  }), false)

  assert.equal(session.shouldShowReviewSaveError("failed"), true)
  assert.equal(session.shouldShowReviewSaveError("ok"), false)
  assert.equal(session.shouldShowReviewSaveError("duplicate"), false)
})

test("a second review submit while pending is a duplicate, not a save failure", () => {
  let selectedAnswer = null
  let answerPending = false

  const recordAnswer = (_answer, _correct, beforeCommit) => {
    if (!session.canStartReviewAnswerRecording({ selectedAnswer, answerPending })) {
      return "duplicate"
    }
    answerPending = true
    if (beforeCommit && !beforeCommit()) {
      answerPending = false
      return "failed"
    }
    selectedAnswer = _answer
    return "ok"
  }

  const first = recordAnswer("a", true, () => true)
  const second = recordAnswer("b", true, () => true)
  const failed = (() => {
    selectedAnswer = null
    answerPending = false
    return recordAnswer("c", true, () => false)
  })()

  assert.equal(first, "ok")
  assert.equal(second, "duplicate")
  assert.equal(failed, "failed")
  assert.equal(session.shouldShowReviewSaveError(first), false)
  assert.equal(session.shouldShowReviewSaveError(second), false)
  assert.equal(session.shouldShowReviewSaveError(failed), true)
  assert.equal(selectedAnswer, null)
})

test("review sessions are invalidated by cross-tab review source storage changes", async () => {
  const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")

  assert.equal(session.shouldInvalidateReviewSession("storage", [STORAGE_KEYS.SRS_KANA]), true)
  assert.equal(session.shouldInvalidateReviewSession("storage", [STORAGE_KEYS.SRS_VOCAB]), true)
  assert.equal(session.shouldInvalidateReviewSession("storage", [STORAGE_KEYS.SRS_MISTAKES]), true)
  assert.equal(session.shouldInvalidateReviewSession("storage", [STORAGE_KEYS.MISTAKES]), true)
  assert.equal(session.shouldInvalidateReviewSession("storage", [STORAGE_KEYS.ITEM_PROGRESS]), false)
  assert.equal(session.shouldInvalidateReviewSession("storage", [STORAGE_KEYS.PRACTICE_RESULTS]), false)
  assert.equal(session.shouldInvalidateReviewSession("storage", [STORAGE_KEYS.USER_PROFILE]), false)
  assert.equal(session.shouldInvalidateReviewSession("backup", [STORAGE_KEYS.SRS_KANA]), false)
  assert.equal(session.shouldInvalidateReviewSession("rollback", [STORAGE_KEYS.SRS_KANA]), false)
})
