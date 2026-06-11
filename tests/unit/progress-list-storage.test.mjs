import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const progressStorage = await loadTsModule("src/lib/progress-list-storage.ts")

function installWindow() {
  const map = new Map()
  const events = []
  global.window = {
    localStorage: {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => map.set(key, String(value)),
    },
    dispatchEvent: (event) => {
      events.push(event)
      return true
    },
  }
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, init) {
      super(type)
      this.detail = init?.detail
    }
  }
  return { map, events }
}

test("progress list storage returns safe fallbacks outside the browser", () => {
  delete global.window

  assert.deepEqual(progressStorage.readProgressList("progress"), [])
  assert.equal(progressStorage.writeProgressList("progress", ["a"]), false)
})

test("progress list storage filters persisted values to strings", () => {
  const { map } = installWindow()
  map.set("progress", JSON.stringify(["a", 1, "ka", null, { id: "bad" }, " a ", "", "ka"]))

  assert.deepEqual(progressStorage.readProgressList("progress"), ["a", "ka"])
})

test("progress list storage normalizes duplicate and empty values", () => {
  assert.deepEqual(progressStorage.normalizeProgressList([" a ", "a", "", "ka", "ka", "  ", 1]), ["a", "ka"])
  assert.deepEqual(progressStorage.normalizeProgressList({ bad: true }), [])
})

test("progress list storage falls back on invalid JSON", () => {
  const { map } = installWindow()
  map.set("progress", "{")

  assert.deepEqual(progressStorage.readProgressList("progress"), [])
})

test("progress list storage writes JSON and dispatches shared update events", () => {
  const { map, events } = installWindow()

  assert.equal(progressStorage.writeProgressList("progress", ["a", "ka", " a ", ""]), true)
  progressStorage.notifyProgressList("progress")

  assert.equal(map.get("progress"), "[\"a\",\"ka\"]")
  assert.equal(events.at(-1).type, progressStorage.PROGRESS_UPDATE_EVENT)
  assert.deepEqual(events.at(-1).detail, { storageKey: "progress" })
})
