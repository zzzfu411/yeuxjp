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

test("cancelled microtask drop keeps the next valid head under Strict Mode remount", async () => {
  // Strict Mode runs effect → cleanup → effect before the first setQueue commit.
  // Two sync dropCurrentReviewItem updaters then chain: [missing, good, later] → [later].
  const queue = ["missing", "good", "later"]
  assert.deepEqual(session.dropCurrentReviewItem(queue), ["good", "later"])
  assert.deepEqual(session.dropCurrentReviewItem(session.dropCurrentReviewItem(queue)), ["later"])

  const updates = []
  const dropCurrent = () => {
    updates.push((prev) => session.dropCurrentReviewItem(prev))
  }
  const runGuardedEffect = () => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      dropCurrent()
    })
    return () => {
      cancelled = true
    }
  }

  const cleanup = runGuardedEffect()
  cleanup()
  runGuardedEffect()
  await new Promise((resolve) => queueMicrotask(resolve))

  const next = updates.reduce((prev, update) => update(prev), queue)
  assert.equal(updates.length, 1)
  assert.deepEqual(next, ["good", "later"])
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

test("planReviewQueueDefer reports a queue change before any React setState would run", () => {
  const mixed = ["vocab", "kana", "mistake"]
  const planned = session.planReviewQueueDefer(mixed)

  assert.equal(planned.didChange, true)
  assert.deepEqual(planned.queue, ["kana", "mistake", "vocab"])
  assert.deepEqual(mixed, ["vocab", "kana", "mistake"])

  assert.deepEqual(session.planReviewQueueDefer(["vocab"]), { queue: ["vocab"], didChange: false })
  assert.deepEqual(session.planReviewQueueDefer([]), { queue: [], didChange: false })
  assert.deepEqual(
    session.planReviewQueueDefer(planned.queue),
    { queue: ["mistake", "vocab", "kana"], didChange: true },
  )
  assert.deepEqual(
    session.planReviewQueueDefer(mixed, (queue) => [queue[1], queue[2], queue[0]]),
    { queue: ["kana", "mistake", "vocab"], didChange: true },
  )
  assert.deepEqual(
    session.planReviewQueueDefer(mixed, (queue) => queue),
    { queue: mixed, didChange: false },
  )
})

test("a successful defer that changes the queue bumps presentationVersion like advance/drop", async () => {
  const today = await loadTsModule("src/lib/today-review-session.ts")
  const vocab = { deck: "vocab", id: "v1" }
  const kana = { deck: "kana", id: "hiragana:a" }
  const mistake = { deck: "mistakes", id: "m1" }

  const applyDeferCurrent = (state, alignQueue, answerPending = false) => {
    if (!session.canDeferReviewItem({ answerPending })) return { ...state, bumped: false }
    const planned = session.planReviewQueueDefer(state.queue, alignQueue)
    if (!planned.didChange) return { ...state, queue: planned.queue, bumped: false }
    return {
      queue: planned.queue,
      presentationVersion: state.presentationVersion + 1,
      selectedAnswer: null,
      lastAnswerCorrect: null,
      bumped: true,
    }
  }

  // The old hook wrote didChange inside a setQueue updater, then read it
  // synchronously. React has not run that updater yet, so the bump was skipped.
  const applyBuggyDeferCurrent = (state, alignQueue) => {
    let didChange = false
    const scheduled = []
    scheduled.push((prev) => {
      const next = alignQueue ? alignQueue(prev) : session.deferCurrentReviewItem(prev)
      if (session.reviewQueuesEqual(next, prev)) return prev
      didChange = true
      return next
    })
    if (!didChange) {
      return { ...state, bumped: false, scheduled }
    }
    return {
      ...state,
      presentationVersion: state.presentationVersion + 1,
      selectedAnswer: null,
      lastAnswerCorrect: null,
      bumped: true,
      scheduled,
    }
  }

  const start = {
    queue: [vocab, kana, mistake],
    presentationVersion: 0,
    selectedAnswer: "みず",
    lastAnswerCorrect: false,
  }

  const buggy = applyBuggyDeferCurrent(start, today.alignTodayReviewQueueForVocabPoolDefer)
  assert.equal(buggy.bumped, false)
  assert.equal(buggy.presentationVersion, 0)
  assert.equal(buggy.selectedAnswer, "みず")

  const deferred = applyDeferCurrent(start, today.alignTodayReviewQueueForVocabPoolDefer)
  assert.equal(deferred.bumped, true)
  assert.equal(deferred.presentationVersion, 1)
  assert.deepEqual(deferred.queue, [kana, mistake, vocab])
  assert.equal(deferred.selectedAnswer, null)
  assert.equal(deferred.lastAnswerCorrect, null)

  const idempotent = applyDeferCurrent(deferred, today.alignTodayReviewQueueForVocabPoolDefer)
  assert.equal(idempotent.bumped, false)
  assert.equal(idempotent.presentationVersion, 1)
  assert.deepEqual(idempotent.queue, [kana, mistake, vocab])

  const defaultDefer = applyDeferCurrent({
    queue: ["vocab", "kana"],
    presentationVersion: 4,
    selectedAnswer: null,
    lastAnswerCorrect: null,
  })
  assert.equal(defaultDefer.bumped, true)
  assert.equal(defaultDefer.presentationVersion, 5)
  assert.deepEqual(defaultDefer.queue, ["kana", "vocab"])

  const single = applyDeferCurrent({
    queue: ["vocab"],
    presentationVersion: 2,
    selectedAnswer: "old",
    lastAnswerCorrect: true,
  })
  assert.equal(single.bumped, false)
  assert.equal(single.presentationVersion, 2)
  assert.equal(single.selectedAnswer, "old")

  const blocked = applyDeferCurrent(start, today.alignTodayReviewQueueForVocabPoolDefer, true)
  assert.equal(blocked.bumped, false)
  assert.equal(blocked.presentationVersion, 0)
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
