import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const recording = await loadTsModule("src/lib/quiz-answer-recording.ts")
const session = await loadTsModule("src/lib/quiz-session.ts")

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
}

const question = {
  type: "particle",
  itemId: "particle-wa",
  itemType: "grammar",
  mode: "recognition",
  questionText: "Choose は",
  correctAnswer: "wa",
  options: [
    { value: "wa", display: "は" },
    { value: "ga", display: "が" },
  ],
}

test("quiz answer recording does not update stats when practice persistence fails", () => {
  installLocalStorage()
  const statsUpdates = []
  const notebookCalls = []

  const result = recording.recordQuizQuestionPractice({
    question,
    selectedAnswer: "ga",
    progress: { recordPractice: () => false },
    notebook: { recordWrong: () => notebookCalls.push("wrong") && true },
    updateStats: (updater) => statsUpdates.push(updater),
  })

  assert.equal(result, null)
  assert.deepEqual(statsUpdates, [])
  assert.deepEqual(notebookCalls, [])
})

test("quiz answer recording fails when question progress metadata is missing", () => {
  installLocalStorage()
  const statsUpdates = []
  const notebookCalls = []
  const progressCalls = []

  const result = recording.recordQuizQuestionPractice({
    question: {
      type: "custom",
      questionText: "Choose",
      correctAnswer: "right",
      options: [{ value: "right", display: "right" }],
    },
    selectedAnswer: "wrong",
    progress: { recordPractice: () => progressCalls.push("practice") && true },
    notebook: { recordWrong: () => notebookCalls.push("wrong") && true },
    updateStats: (updater) => statsUpdates.push(updater),
  })

  assert.equal(result, null)
  assert.deepEqual(progressCalls, [])
  assert.deepEqual(notebookCalls, [])
  assert.deepEqual(statsUpdates, [])
})

test("quiz answer recording updates stats only after practice writes succeed", () => {
  installLocalStorage()
  let stats = session.createQuizStats()

  const result = recording.recordQuizQuestionPractice({
    question,
    selectedAnswer: "wa",
    progress: { recordPractice: () => true },
    notebook: { recordWrong: () => false },
    updateStats: (updater) => {
      stats = updater(stats)
    },
  })

  assert.equal(result?.correct, true)
  assert.deepEqual(stats, { score: 1, total: 1 })
})
