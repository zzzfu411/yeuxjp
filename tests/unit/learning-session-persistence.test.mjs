import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const session = await loadTsModule("src/lib/learning-session.ts")
const progressModel = await loadTsModule("src/lib/learning-progress-model.ts")
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

      try {
        window.localStorage.setItem(storage.STORAGE_KEYS.PRACTICE_RESULTS, JSON.stringify(nextResults))
        window.localStorage.setItem(storage.STORAGE_KEYS.ITEM_PROGRESS, JSON.stringify(nextItems))
        return true
      } catch {
        window.localStorage.setItem(storage.STORAGE_KEYS.PRACTICE_RESULTS, JSON.stringify(previousResults))
        return false
      }
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
