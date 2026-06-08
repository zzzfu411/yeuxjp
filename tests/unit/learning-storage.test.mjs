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
})
