import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const session = await loadTsModule("src/lib/learning-session.ts")
const progressModel = await loadTsModule("src/lib/learning-progress-model.ts")
const learningStorage = await loadTsModule("src/lib/learning-storage.ts")
const questions = await loadTsModule("src/lib/questions.ts")
const review = await loadTsModule("src/lib/review-questions.ts")
const storage = await loadTsModule("src/lib/storage-keys.ts")

function installLocalStorage({ failKeys = new Set() } = {}) {
  const map = new Map()
  const events = []
  global.window = {
    localStorage: {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => {
        if (failKeys.has(key)) {
          throw new Error(`write failed: ${key}`)
        }
        map.set(key, String(value))
      },
      removeItem: (key) => map.delete(key),
    },
    dispatchEvent: (event) => {
      events.push(event)
      return true
    },
  }
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, init = {}) {
      super(type)
      this.detail = init.detail
    }
  }
  return { map, events }
}

function createProgressApi() {
  return {
    recordPractice(result) {
      const createdAt = Date.now()
      const previousResults = progressModel.normalizePracticeResults(
        JSON.parse(window.localStorage.getItem(storage.STORAGE_KEYS.PRACTICE_RESULTS) ?? "[]")
      )
      const previousItems = progressModel.normalizeItemProgressMap(
        JSON.parse(window.localStorage.getItem(storage.STORAGE_KEYS.ITEM_PROGRESS) ?? "{}")
      )
      const nextResults = progressModel.appendPracticeResult(previousResults, result, createdAt)
      const nextResult = nextResults.at(-1)
      if (!nextResult) return false
      const nextItems = progressModel.updateItemProgressForPractice(previousItems, nextResult)
      return (
        learningStorage.writeLearningJson(storage.STORAGE_KEYS.PRACTICE_RESULTS, nextResults) &&
        learningStorage.writeLearningJson(storage.STORAGE_KEYS.ITEM_PROGRESS, nextItems)
      )
    },
  }
}

test("practice recording failure prevents review enrollment", () => {
  const { map } = installLocalStorage({ failKeys: new Set([storage.STORAGE_KEYS.ITEM_PROGRESS]) })

  assert.equal(session.recordPracticeResult(createProgressApi(), {
    itemId: "a",
    itemType: "kana",
    mode: "recognition",
    correct: true,
    answer: "a",
  }), false)

  assert.equal(map.has(storage.STORAGE_KEYS.PRACTICE_RESULTS), false)
  assert.equal(map.has(storage.STORAGE_KEYS.SRS_KANA), false)
})

test("review enrollment failure rolls back direct practice recording", () => {
  const { map } = installLocalStorage({ failKeys: new Set([storage.STORAGE_KEYS.SRS_KANA]) })

  assert.equal(session.recordPracticeResult(createProgressApi(), {
    itemId: "a",
    itemType: "kana",
    mode: "recognition",
    correct: true,
    answer: "a",
  }), false)

  assert.equal(map.has(storage.STORAGE_KEYS.PRACTICE_RESULTS), false)
  assert.equal(map.has(storage.STORAGE_KEYS.ITEM_PROGRESS), false)
  assert.equal(map.has(storage.STORAGE_KEYS.SRS_KANA), false)
})

test("successful correct practice records progress and enrolls review", () => {
  const { map } = installLocalStorage()

  assert.equal(session.recordPracticeResult(createProgressApi(), {
    itemId: "sur-g-1",
    itemType: "vocab",
    mode: "meaning",
    correct: true,
    answer: "sur-g-1",
  }), true)

  assert.equal(JSON.parse(map.get(storage.STORAGE_KEYS.PRACTICE_RESULTS)).length, 1)
  assert.ok(JSON.parse(map.get(storage.STORAGE_KEYS.ITEM_PROGRESS))["sur-g-1"])
  assert.ok(JSON.parse(map.get(storage.STORAGE_KEYS.SRS_VOCAB))["sur-g-1"])
})

test("mistake review questions with progress metadata write original item practice", () => {
  const { map } = installLocalStorage()
  const question = review.mistakeToQuestion({
    id: "m1",
    type: "hiragana-romaji",
    questionText: "あ",
    itemId: "a",
    itemType: "kana",
    mode: "recognition",
    correctAnswer: "a",
    options: [
      { value: "a", display: "a" },
      { value: "i", display: "i" },
    ],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 1,
  })

  assert.equal(session.recordQuestionPractice({
    progress: createProgressApi(),
    result: questions.makeQuestionResult(question, "a", 123),
    enrollReviewOnCorrect: false,
  }), true)

  const practice = JSON.parse(map.get(storage.STORAGE_KEYS.PRACTICE_RESULTS))
  const itemProgress = JSON.parse(map.get(storage.STORAGE_KEYS.ITEM_PROGRESS))
  assert.deepEqual(practice.map((item) => ({
    itemId: item.itemId,
    itemType: item.itemType,
    mode: item.mode,
    correct: item.correct,
    answer: item.answer,
  })), [
    {
      itemId: "a",
      itemType: "kana",
      mode: "recognition",
      correct: true,
      answer: "a",
    },
  ])
  assert.ok(itemProgress.a)
  assert.equal(map.has(storage.STORAGE_KEYS.SRS_KANA), false)
})

test("legacy mistake review questions without progress metadata stay compatible", () => {
  const { map } = installLocalStorage()
  const question = review.mistakeToQuestion({
    id: "legacy",
    type: "legacy-mistake",
    questionText: "prompt",
    correctAnswer: "right",
    options: [{ value: "right", display: "right" }],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 1,
  })

  assert.equal(session.recordQuestionPractice({
    progress: createProgressApi(),
    result: questions.makeQuestionResult(question, "right", 123),
    enrollReviewOnCorrect: false,
  }), true)

  assert.equal(map.has(storage.STORAGE_KEYS.PRACTICE_RESULTS), false)
  assert.equal(map.has(storage.STORAGE_KEYS.ITEM_PROGRESS), false)
})
