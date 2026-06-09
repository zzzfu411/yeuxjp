import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const session = await loadTsModule("src/lib/learning-session.ts")

function installLocalStorage() {
  const store = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    dispatchEvent: () => {},
  }
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, init = {}) {
      super(type)
      this.detail = init.detail
    }
  }
  return store
}

test("correct practice only enrolls reviewable kana and vocabulary SRS items", () => {
  const store = installLocalStorage()
  const progress = { recordPractice: () => true }

  assert.equal(session.recordPracticeResult(progress, {
    itemId: "a",
    itemType: "kana",
    mode: "recognition",
    correct: true,
    answer: "a",
  }), true)
  assert.equal(session.recordPracticeResult(progress, {
    itemId: "sokuon:きって",
    itemType: "kana",
    mode: "audio",
    correct: true,
    answer: "きって",
  }), true)
  assert.equal(session.recordPracticeResult(progress, {
    itemId: "vocab-1",
    itemType: "vocab",
    mode: "meaning",
    correct: true,
    answer: "vocab-1",
  }), true)

  const kanaSrs = JSON.parse(store.get("yasashi.srs.kana.v1"))
  const vocabSrs = JSON.parse(store.get("yasashi.srs.vocab.v1"))
  assert.ok(kanaSrs.a)
  assert.equal(kanaSrs["sokuon:きって"], undefined)
  assert.ok(vocabSrs["vocab-1"])
})

test("wrong practice records progress but does not enroll SRS", () => {
  const store = installLocalStorage()
  const recorded = []
  const progress = {
    recordPractice: (result) => {
      recorded.push(result)
      return true
    },
  }

  assert.equal(session.recordPracticeResult(progress, {
    itemId: "ka",
    itemType: "kana",
    mode: "recognition",
    correct: false,
    answer: "a",
  }), true)

  assert.equal(recorded.length, 1)
  assert.equal(store.get("yasashi.srs.kana.v1"), undefined)
})

test("failed practice writes do not enroll SRS", () => {
  const store = installLocalStorage()
  const progress = { recordPractice: () => false }

  assert.equal(session.recordPracticeResult(progress, {
    itemId: "a",
    itemType: "kana",
    mode: "recognition",
    correct: true,
    answer: "a",
  }), false)

  assert.equal(store.get("yasashi.srs.kana.v1"), undefined)
})

test("recordQuestionPractice returns false when progress recording fails before mistakes are written", () => {
  installLocalStorage()
  let mistakeRecorded = false
  const progress = { recordPractice: () => false }
  const notebook = {
    recordWrong: () => {
      mistakeRecorded = true
      return true
    },
  }

  const ok = session.recordQuestionPractice({
    progress,
    notebook,
    result: {
      question: {
        type: "kana",
        itemId: "a",
        itemType: "kana",
        mode: "recognition",
        correctAnswer: "a",
        options: [{ value: "a", display: "a" }],
      },
      selectedAnswer: "ka",
      correct: false,
      answeredAt: 123,
    },
  })

  assert.equal(ok, false)
  assert.equal(mistakeRecorded, false)
})
