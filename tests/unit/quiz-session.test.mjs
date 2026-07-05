import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const session = await loadTsModule("src/lib/quiz-session.ts")

test("quiz stats start empty and track correct answer totals", () => {
  let stats = session.createQuizStats()
  assert.deepEqual(stats, { score: 0, total: 0 })
  assert.equal(session.getQuizAccuracy(stats), null)

  stats = session.recordQuizAnswer(stats, true)
  stats = session.recordQuizAnswer(stats, false)
  stats = session.recordQuizAnswer(stats, true)

  assert.deepEqual(stats, { score: 2, total: 3 })
  assert.equal(session.getQuizAccuracy(stats), 67)
})

test("quiz answer submissions start only for unanswered active questions", () => {
  assert.equal(session.canStartQuizAnswerSubmission({
    selectedOption: null,
    answerPending: false,
    hasQuestion: true,
  }), true)
  assert.equal(session.canStartQuizAnswerSubmission({
    selectedOption: "a",
    answerPending: false,
    hasQuestion: true,
  }), false)
  assert.equal(session.canStartQuizAnswerSubmission({
    selectedOption: null,
    answerPending: true,
    hasQuestion: true,
  }), false)
  assert.equal(session.canStartQuizAnswerSubmission({
    selectedOption: null,
    answerPending: false,
    hasQuestion: false,
  }), false)
})

test("quiz answer submission state preserves retryability after save failures", () => {
  assert.deepEqual(session.resolveQuizAnswerSubmission("a", false), {
    answerPending: false,
    saveError: true,
    selectedOption: null,
  })

  assert.deepEqual(session.resolveQuizAnswerSubmission("a", true), {
    answerPending: true,
    saveError: false,
    selectedOption: "a",
  })
})
