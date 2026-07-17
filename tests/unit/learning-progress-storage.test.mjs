import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const progressStorage = await loadTsModule("src/lib/learning-progress-storage.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")

function installWindow() {
  const map = new Map()
  global.window = {
    localStorage: {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => map.set(key, String(value)),
    },
  }
  return map
}

test("learning progress storage distinguishes missing values from malformed collections", () => {
  const map = installWindow()

  assert.equal(progressStorage.readLessonProgressMapResult().status, "missing")
  map.set(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify({ bad: "entry" }))
  map.set(STORAGE_KEYS.ITEM_PROGRESS, JSON.stringify({ bad: null }))
  map.set(STORAGE_KEYS.PRACTICE_RESULTS, JSON.stringify([{ bad: true }]))
  map.set(STORAGE_KEYS.USER_PROFILE, JSON.stringify([]))

  assert.equal(progressStorage.readLessonProgressMapResult().status, "invalid")
  assert.equal(progressStorage.readItemProgressMapResult().status, "invalid")
  assert.equal(progressStorage.readPracticeResultsResult().status, "invalid")
  assert.equal(progressStorage.readUserProfileResult().status, "invalid")
})

test("learning progress storage keeps recoverable entries while filtering bad siblings", () => {
  const map = installWindow()
  map.set(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify({
    bad: "entry",
    day1: { lessonId: "day1", status: "started", startedAt: 10 },
  }))
  map.set(STORAGE_KEYS.PRACTICE_RESULTS, JSON.stringify([
    { bad: true },
    { itemId: "hiragana:a", itemType: "kana", mode: "recognition", correct: true, createdAt: 10 },
  ]))

  const lessons = progressStorage.readLessonProgressMapResult()
  const results = progressStorage.readPracticeResultsResult()
  assert.equal(lessons.ok, true)
  assert.deepEqual(Object.keys(lessons.value), ["day1"])
  assert.equal(results.ok, true)
  assert.equal(results.value.length, 1)
})
