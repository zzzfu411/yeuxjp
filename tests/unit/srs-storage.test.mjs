import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/srs-model.ts")
const storage = await loadTsModule("src/lib/srs-storage.ts")

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
    constructor(type, init) {
      super(type)
      this.detail = init?.detail
    }
  }

  return { map, events }
}

test("srs storage returns safe fallbacks outside the browser", () => {
  delete global.window

  assert.deepEqual(storage.readSrsMap("missing"), {})
  assert.equal(storage.writeSrsMap("missing", {}), false)
})

test("srs storage reads valid persisted maps and normalizes values", () => {
  const { map } = installWindow()
  map.set("deck", JSON.stringify({ item: { box: 99, dueAt: 10, createdAt: 5, right: -1, wrong: 2.2 } }))

  const deck = storage.readSrsMap("deck")

  assert.equal(deck.item.box, 6)
  assert.equal(deck.item.dueAt, 10)
  assert.equal(deck.item.createdAt, 5)
  assert.equal(deck.item.right, 0)
  assert.equal(deck.item.wrong, 2)
})

test("srs storage ignores invalid persisted JSON", () => {
  const { map } = installWindow()
  map.set("broken", "{")

  assert.deepEqual(storage.readSrsMap("broken"), {})
})

test("enrollSrs creates a review item and dispatches an update", () => {
  const { map, events } = installWindow()
  const now = 1_700_000_000_000

  assert.equal(storage.enrollSrs("deck", "kana:a", now), true)
  assert.equal(storage.enrollSrs("deck", "kana:a", now + 1_000), true)

  const deck = JSON.parse(map.get("deck"))
  assert.deepEqual(Object.keys(deck), ["kana:a"])
  assert.equal(deck["kana:a"].createdAt, now)
  assert.equal(deck["kana:a"].dueAt, now + 10 * 60 * 1000)
  assert.equal(events.length, 1)
  assert.equal(events[0].type, storage.SRS_EVENT)
  assert.deepEqual(events[0].detail, { storageKey: "deck" })
})

test("gradeSrs applies results to existing review history", () => {
  const { map, events } = installWindow()
  const createdAt = 1_700_000_000_000
  const now = createdAt + 30 * 60 * 1000
  map.set(
    "deck",
    JSON.stringify({
      "mistake:a": {
        box: 3,
        dueAt: now - 1,
        createdAt,
        lastReviewedAt: createdAt + 10,
        right: 2,
        wrong: 1,
      },
    })
  )

  assert.equal(storage.gradeSrs("deck", "mistake:a", "again", now), true)

  const deck = JSON.parse(map.get("deck"))
  assert.equal(deck["mistake:a"].box, 0)
  assert.equal(deck["mistake:a"].dueAt, now)
  assert.equal(deck["mistake:a"].createdAt, createdAt)
  assert.equal(deck["mistake:a"].lastReviewedAt, now)
  assert.equal(deck["mistake:a"].right, 2)
  assert.equal(deck["mistake:a"].wrong, 2)
  assert.equal(events.length, 1)
  assert.deepEqual(events[0].detail, { storageKey: "deck" })
})

test("gradeSrs creates missing items before applying a result", () => {
  const { map, events } = installWindow()
  const now = 1_700_000_000_000

  assert.equal(storage.gradeSrs("deck", "vocab:neko", "good", now), true)

  const deck = JSON.parse(map.get("deck"))
  assert.equal(deck["vocab:neko"].box, 2)
  assert.equal(deck["vocab:neko"].createdAt, now)
  assert.equal(deck["vocab:neko"].lastReviewedAt, now)
  assert.equal(deck["vocab:neko"].right, 1)
  assert.equal(deck["vocab:neko"].wrong, 0)
  assert.equal(events.length, 1)
})

test("setSrsState, removeSrs, and clearSrs persist changes and notify listeners", () => {
  const { map, events } = installWindow()
  const now = 1_700_000_000_000
  const state = model.createSrsState(now)

  assert.equal(storage.setSrsState("deck", "vocab:neko", { ...state, box: 2, right: 1 }), true)
  let deck = JSON.parse(map.get("deck"))
  assert.equal(deck["vocab:neko"].box, 2)
  assert.equal(deck["vocab:neko"].right, 1)

  assert.equal(storage.removeSrs("deck", "missing"), true)
  assert.equal(events.length, 1)

  assert.equal(storage.removeSrs("deck", "vocab:neko"), true)
  deck = JSON.parse(map.get("deck"))
  assert.deepEqual(deck, {})
  assert.equal(events.length, 2)

  assert.equal(storage.clearSrs("deck"), true)
  assert.deepEqual(JSON.parse(map.get("deck")), {})
  assert.equal(events.length, 3)
  assert.ok(events.every((event) => event.type === storage.SRS_EVENT))
})

test("srs storage does not notify when writes fail", () => {
  const { events } = installWindow({ failSet: true })
  const state = model.createSrsState(1_700_000_000_000)

  assert.equal(storage.enrollSrs("deck", "kana:a"), false)
  assert.equal(storage.gradeSrs("deck", "kana:a", "again"), false)
  assert.equal(storage.setSrsState("deck", "kana:a", state), false)
  assert.equal(storage.clearSrs("deck"), false)
  assert.equal(events.length, 0)
})
