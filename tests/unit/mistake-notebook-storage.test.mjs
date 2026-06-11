import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const storage = await loadTsModule("src/lib/mistake-notebook-storage.ts")

function installWindow({ failSet = false } = {}) {
  const map = new Map()
  const events = []

  global.window = {
    localStorage: {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => {
        if (failSet) throw new Error("quota")
        map.set(key, String(value))
      },
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

test("mistake notebook storage returns safe fallbacks outside the browser", () => {
  delete global.window

  assert.deepEqual(storage.readMistakeList("mistakes"), [])
  assert.equal(storage.writeMistakeList("mistakes", []), false)
})

test("mistake notebook storage reads and normalizes persisted lists", () => {
  const { map } = installWindow()
  map.set(
    "mistakes",
    JSON.stringify([
      {
        id: "m1",
        type: "quiz:vocab",
        correctAnswer: "water",
        options: [{ value: "water", display: "water" }],
        wrongCount: 2,
        createdAt: 1,
        lastWrongAt: 3,
      },
    ])
  )

  const list = storage.readMistakeList("mistakes")

  assert.equal(list.length, 1)
  assert.equal(list[0].id, "m1")
  assert.equal(list[0].wrongCount, 2)
})

test("mistake notebook storage falls back on invalid JSON and failed writes", () => {
  const { map } = installWindow()
  map.set("mistakes", "{")

  assert.deepEqual(storage.readMistakeList("mistakes"), [])

  const failing = installWindow({ failSet: true })
  assert.equal(storage.writeMistakeList("mistakes", []), false)
  assert.equal(failing.events.length, 0)
})

test("mistake notebook storage dispatches same-tab update events on demand", () => {
  const { events } = installWindow()

  storage.notifyMistakeNotebook("mistakes")

  assert.equal(events.length, 1)
  assert.equal(events[0].type, storage.MISTAKE_NOTEBOOK_EVENT)
  assert.deepEqual(events[0].detail, { storageKey: "mistakes" })
})
