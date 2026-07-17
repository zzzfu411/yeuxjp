import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const storage = await loadTsModule("src/lib/learning-storage.ts")

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

test("learning storage returns fallbacks outside the browser", () => {
  delete global.window

  assert.deepEqual(storage.readLearningJson("missing", { ok: true }), { ok: true })
  assert.equal(storage.writeLearningJson("missing", { ok: true }), false)
})

test("learning storage reads and writes JSON values", () => {
  const { map, events } = installWindow()
  map.set("profile", '{"goal":"balanced"}')

  assert.deepEqual(storage.readLearningJson("profile", null), { goal: "balanced" })
  assert.equal(storage.writeLearningJson("profile", { goal: "steady" }), true)
  assert.equal(map.get("profile"), '{"goal":"steady"}')
  assert.equal(events.at(-1).type, storage.LEARNING_EVENT)
  assert.deepEqual(events.at(-1).detail, { key: "profile" })
})

test("learning storage falls back when persisted JSON is invalid", () => {
  const { map } = installWindow()
  map.set("broken", "{")

  assert.deepEqual(storage.readLearningJson("broken", []), [])
  assert.deepEqual(storage.readLearningJsonResult("broken", []).status, "invalid")
  assert.equal(storage.writeLearningJson("broken", ["replacement"]), false)
  assert.equal(map.get("broken"), "{")
  assert.equal(storage.writeLearningJson("broken", ["replacement"], { replaceInvalid: true }), true)
  assert.equal(map.get("broken"), '["replacement"]')
})

test("learning storage rejects stale read snapshots", () => {
  const { map } = installWindow()
  map.set("progress", '["old"]')
  const snapshot = storage.readLearningJsonResult("progress", [])
  map.set("progress", '["newer-tab"]')

  assert.equal(storage.writeLearningJson("progress", ["old", "local"], { expectedRaw: snapshot.raw }), false)
  assert.equal(map.get("progress"), '["newer-tab"]')
})

test("learning storage distinguishes missing and unavailable values", () => {
  const { map } = installWindow()

  assert.equal(storage.readLearningJsonResult("missing", null).status, "missing")
  map.set("empty-string", "")
  assert.equal(storage.readLearningJsonResult("empty-string", null).status, "invalid")

  global.window.localStorage.getItem = () => {
    throw new Error("blocked")
  }
  assert.equal(storage.readLearningJsonResult("profile", null).status, "unavailable")
  assert.equal(storage.writeLearningJson("profile", { goal: "balanced" }), false)
})
