import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const session = await loadTsModule("src/lib/learning-session.ts")
const storeFacade = await loadTsModule("src/lib/learning-store.ts")
const storage = await loadTsModule("src/lib/storage-keys.ts")
const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

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
    itemId: "sur-g-1",
    itemType: "vocab",
    mode: "meaning",
    correct: true,
    answer: "sur-g-1",
  }), true)
  assert.equal(session.recordPracticeResult(progress, {
    itemId: "sur-g-999",
    itemType: "vocab",
    mode: "meaning",
    correct: true,
    answer: "sur-g-999",
  }), true)

  const kanaSrs = JSON.parse(store.get(storage.STORAGE_KEYS.SRS_KANA))
  const vocabSrs = JSON.parse(store.get(storage.STORAGE_KEYS.SRS_VOCAB))
  assert.ok(kanaSrs.a)
  assert.equal(kanaSrs["sokuon:きって"], undefined)
  assert.ok(vocabSrs["sur-g-1"])
  assert.equal(vocabSrs["sur-g-999"], undefined)
})

test("review enrollment predicate matches actual SRS eligibility", () => {
  assert.equal(session.canEnrollReviewItem("kana", "a"), true)
  assert.equal(session.canEnrollReviewItem("kana", "sokuon:きって"), false)
  assert.equal(session.canEnrollReviewItem("vocab", "sur-g-1"), true)
  assert.equal(session.canEnrollReviewItem("vocab", "sur-g-999"), false)
  assert.equal(session.canEnrollReviewItem("grammar", "n5-wa"), false)
  assert.equal(session.canEnrollReviewItem("sentence", "sentence-intro-student"), false)
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
  assert.equal(store.get(storage.STORAGE_KEYS.SRS_KANA), undefined)
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

  assert.equal(store.get(storage.STORAGE_KEYS.SRS_KANA), undefined)
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

test("recordQuestionPractice rolls back managed storage when a later notebook write fails", () => {
  const store = installLocalStorage()
  store.set(storage.STORAGE_KEYS.PRACTICE_RESULTS, "[]")
  const progress = {
    recordPractice: () => {
      storeFacade.writeManagedLearningStorage(storage.STORAGE_KEYS.PRACTICE_RESULTS, "[{\"itemId\":\"a\"}]")
      return true
    },
  }
  const notebook = { recordWrong: () => false }

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
  assert.equal(store.get(storage.STORAGE_KEYS.PRACTICE_RESULTS), "[]")
})

test("recordQuestionPractice public entrypoint is wrapped in a managed storage transaction", () => {
  const source = read("src/lib/learning-session.ts")

  assert.match(source, /runLearningStorageTransaction/)
  assert.match(source, /function recordPracticeResultWithoutTransaction\(/)
  assert.match(source, /export function canEnrollReviewItem\(/)
  assert.match(source, /export function recordPracticeResult\(/)
  assert.match(source, /return runLearningStorageTransaction\(\(\) => recordPracticeResultWithoutTransaction\(progress, result\)\)/)
  assert.match(source, /export function recordQuestionPractice\(/)
  assert.match(source, /return runLearningStorageTransaction\(\(\) => recordQuestionPracticeWithoutTransaction\(\{/)
  assert.match(source, /export function recordQuestionPracticeWithoutTransaction\(/)
  assert.match(source, /recordPracticeResultWithoutTransaction\(progress, \{/)
})
