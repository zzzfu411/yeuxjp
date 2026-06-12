import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

function installEventWindow() {
  const listeners = new Map()
  const channels = []

  class FakeBroadcastChannel {
    constructor(name) {
      this.name = name
      this.closed = false
      this.listeners = new Map()
      this.messages = []
      channels.push(this)
    }

    addEventListener(type, listener) {
      const entries = this.listeners.get(type) ?? []
      entries.push(listener)
      this.listeners.set(type, entries)
    }

    removeEventListener(type, listener) {
      const entries = this.listeners.get(type) ?? []
      this.listeners.set(type, entries.filter((item) => item !== listener))
    }

    postMessage(message) {
      this.messages.push(message)
    }

    emit(type, data) {
      for (const listener of this.listeners.get(type) ?? []) {
        listener({ data })
      }
    }

    close() {
      this.closed = true
    }
  }

  global.window = {
    BroadcastChannel: FakeBroadcastChannel,
    addEventListener: (type, listener) => {
      const entries = listeners.get(type) ?? []
      entries.push(listener)
      listeners.set(type, entries)
    },
    removeEventListener: (type, listener) => {
      const entries = listeners.get(type) ?? []
      listeners.set(type, entries.filter((item) => item !== listener))
    },
    dispatchEvent: (event) => {
      for (const listener of listeners.get(event.type) ?? []) {
        listener(event)
      }
      return true
    },
  }
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, init = {}) {
      super(type)
      this.detail = init.detail
    }
  }

  return { channels, listeners }
}

test("learning store listeners ignore same-tab broadcast echoes and malformed details", async () => {
  const { channels } = installEventWindow()
  const events = await loadTsModule("src/lib/learning-events.ts")
  const received = []

  const remove = events.addLearningStoreListener((detail) => received.push(detail))
  assert.equal(channels.length, 1)
  const listenerChannel = channels[0]

  events.notifyLearningStoreEvent({ action: "restore", keys: ["profile"] })

  assert.deepEqual(received, [{ action: "restore", keys: ["profile"] }])
  assert.equal(channels.length, 2)
  assert.equal(channels[1].closed, true)
  assert.equal(channels[1].messages.length, 1)
  assert.equal(channels[1].messages[0].action, "restore")
  assert.deepEqual(channels[1].messages[0].keys, ["profile"])
  assert.equal(typeof channels[1].messages[0].sourceId, "string")

  listenerChannel.emit("message", channels[1].messages[0])
  listenerChannel.emit("message", { action: "restore", keys: [123] })
  listenerChannel.emit("message", { action: 123, keys: ["profile"] })

  assert.deepEqual(received, [{ action: "restore", keys: ["profile"] }])

  remove()
  assert.equal(listenerChannel.closed, true)
})

test("learning store listeners accept sanitized cross-tab broadcast messages", async () => {
  const { channels } = installEventWindow()
  const events = await loadTsModule("src/lib/learning-events.ts")
  const received = []

  events.addLearningStoreListener((detail) => received.push(detail))
  channels[0].emit("message", {
    action: "reset",
    keys: ["lessons", "practice"],
    sourceId: "another-tab",
    ignored: true,
  })

  assert.deepEqual(received, [{ action: "reset", keys: ["lessons", "practice"] }])
})
