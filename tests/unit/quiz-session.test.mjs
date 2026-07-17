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

test("quiz auto-generation pauses while an answer is pending or visible", () => {
  assert.equal(session.shouldAutoGenerateQuizQuestion({
    selectedOption: null,
    answerPending: false,
  }), true)
  assert.equal(session.shouldAutoGenerateQuizQuestion({
    selectedOption: null,
    answerPending: true,
  }), false)
  assert.equal(session.shouldAutoGenerateQuizQuestion({
    selectedOption: "vocab-id",
    answerPending: false,
  }), false)
  assert.equal(session.shouldAutoGenerateQuizQuestion({
    selectedOption: "vocab-id",
    answerPending: true,
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

function makeQuizQuestion(overrides = {}) {
  return {
    type: "kana",
    itemId: "a",
    itemType: "kana",
    mode: "recognition",
    questionText: "あ",
    correctAnswer: "a",
    options: [
      { value: "a", display: "a" },
      { value: "i", display: "i" },
    ],
    ...overrides,
  }
}

test("quiz question keys identify repeated prompts", () => {
  const question = makeQuizQuestion()

  assert.equal(session.getQuizQuestionKey(question), "kana:あ:a")
  assert.equal(session.getQuizQuestionKey(makeQuizQuestion({ questionText: undefined })), "kana::a")
  assert.notEqual(
    session.getQuizQuestionKey(question),
    session.getQuizQuestionKey(makeQuizQuestion({ correctAnswer: "i" }))
  )
})

test("pickFreshQuizQuestion retries when the generator repeats the previous question", () => {
  const repeated = makeQuizQuestion()
  const fresh = makeQuizQuestion({ questionText: "い", correctAnswer: "i" })
  const generated = [repeated, repeated, fresh]
  let calls = 0

  const question = session.pickFreshQuizQuestion(() => generated[calls++], session.getQuizQuestionKey(repeated))

  assert.equal(calls, 3)
  assert.equal(question, fresh)
})

test("pickFreshQuizQuestion keeps a repeated question when the pool cannot offer another", () => {
  const repeated = makeQuizQuestion()
  let calls = 0

  const question = session.pickFreshQuizQuestion(
    () => {
      calls += 1
      return repeated
    },
    session.getQuizQuestionKey(repeated)
  )

  assert.equal(calls, 3)
  assert.equal(question, repeated)
})

test("pickFreshQuizQuestion accepts the first question without a previous key", () => {
  const first = makeQuizQuestion()
  let calls = 0

  const question = session.pickFreshQuizQuestion(
    () => {
      calls += 1
      return first
    },
    null
  )

  assert.equal(calls, 1)
  assert.equal(question, first)
})

test("pickFreshQuizQuestion returns null when the generator has no questions", () => {
  assert.equal(session.pickFreshQuizQuestion(() => null, null), null)
})
