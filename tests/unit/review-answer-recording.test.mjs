import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const recording = await loadTsModule("src/lib/review-answer-recording.ts")
const storeFacade = await loadTsModule("src/lib/learning-store.ts")
const storage = await loadTsModule("src/lib/storage-keys.ts")

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

const kanaQuestion = {
  type: "kana",
  itemId: "a",
  itemType: "kana",
  mode: "recognition",
  questionText: "What is あ?",
  correctAnswer: "a",
  options: [
    { value: "a", display: "a" },
    { value: "ka", display: "ka" },
  ],
}

test("review answer recording refuses to commit when the queued SRS item is gone", () => {
  installLocalStorage()
  const calls = []

  const recorded = recording.recordReviewQuestionPractice({
    question: kanaQuestion,
    selectedAnswer: "a",
    progress: { recordPractice: () => calls.push("progress") && true },
    notebook: { recordWrong: () => calls.push("notebook") && true },
    canRecord: () => calls.push("canRecord") && false,
    grade: () => calls.push("grade") && true,
    recordAnswer: (_answer, _correct, beforeCommit) => {
      calls.push("recordAnswer")
      return beforeCommit()
    },
  })

  assert.equal(recorded, false)
  assert.deepEqual(calls, ["recordAnswer", "canRecord"])
})

test("review answer recording rolls back progress and mistakes when SRS grading fails", () => {
  const store = installLocalStorage()
  store.set(storage.STORAGE_KEYS.PRACTICE_RESULTS, "[]")
  store.set(storage.STORAGE_KEYS.ITEM_PROGRESS, "{}")
  store.set(storage.STORAGE_KEYS.MISTAKES, "[]")
  store.set(storage.STORAGE_KEYS.SRS_KANA, "{\"a\":{\"box\":1}}")

  const result = {
    question: kanaQuestion,
    selectedAnswer: "ka",
    correct: false,
    answeredAt: 123,
  }

  const ok = recording.commitReviewQuestionPractice({
    result,
    progress: {
      recordPractice: () => {
        storeFacade.writeManagedLearningStorage(storage.STORAGE_KEYS.PRACTICE_RESULTS, "[{\"itemId\":\"a\"}]")
        storeFacade.writeManagedLearningStorage(storage.STORAGE_KEYS.ITEM_PROGRESS, "{\"a\":{\"attempts\":1}}")
        return true
      },
    },
    notebook: {
      recordWrong: () => {
        storeFacade.writeManagedLearningStorage(storage.STORAGE_KEYS.MISTAKES, "[{\"id\":\"m1\"}]")
        return true
      },
    },
    canRecord: () => true,
    grade: () => {
      storeFacade.writeManagedLearningStorage(storage.STORAGE_KEYS.SRS_KANA, "{\"a\":{\"box\":0}}")
      return false
    },
  })

  assert.equal(ok, false)
  assert.equal(store.get(storage.STORAGE_KEYS.PRACTICE_RESULTS), "[]")
  assert.equal(store.get(storage.STORAGE_KEYS.ITEM_PROGRESS), "{}")
  assert.equal(store.get(storage.STORAGE_KEYS.MISTAKES), "[]")
  assert.equal(store.get(storage.STORAGE_KEYS.SRS_KANA), "{\"a\":{\"box\":1}}")
})
