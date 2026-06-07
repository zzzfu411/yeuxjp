import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const store = await loadTsModule("src/lib/learning-store.ts")
const storage = await loadTsModule("src/lib/storage-keys.ts")

function installWindow() {
  const map = new Map()
  const events = []
  global.window = {
    localStorage: {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => map.set(key, String(value)),
      removeItem: (key) => map.delete(key),
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

test("learning backups include existing learning keys and can restore them", () => {
  const { map } = installWindow()
  map.set(storage.STORAGE_KEYS.USER_PROFILE, '{"goal":"balanced"}')
  map.set(storage.STORAGE_KEYS.SRS_KANA, '{"a":{"box":1}}')

  const backup = store.createLearningBackup(123)
  assert.equal(backup.version, store.LEARNING_BACKUP_VERSION)
  assert.equal(backup.exportedAt, 123)
  assert.equal(backup.entries[storage.STORAGE_KEYS.USER_PROFILE], '{"goal":"balanced"}')

  map.clear()
  map.set(storage.STORAGE_KEYS.MISTAKES, "[{\"id\":\"stale\"}]")
  assert.equal(store.restoreLearningBackup(backup), true)
  assert.equal(map.get(storage.STORAGE_KEYS.SRS_KANA), '{"a":{"box":1}}')
  assert.equal(map.has(storage.STORAGE_KEYS.MISTAKES), false)
})

test("resetLearningData removes all managed keys but leaves unrelated localStorage alone", () => {
  const { map } = installWindow()
  for (const key of store.getLearningBackupKeys()) {
    map.set(key, "value")
  }
  map.set("unrelated", "keep")

  assert.equal(store.resetLearningData(), true)
  for (const key of store.getLearningBackupKeys()) {
    assert.equal(map.has(key), false)
  }
  assert.equal(map.get("unrelated"), "keep")
})

test("learning store events include changed keys for UI sync", () => {
  const { map, events } = installWindow()
  map.set(storage.STORAGE_KEYS.USER_PROFILE, '{"goal":"balanced"}')
  map.set(storage.STORAGE_KEYS.MISTAKES, "[]")

  const backup = store.createLearningBackup(456)
  assert.equal(events.at(-1).type, store.LEARNING_STORE_EVENT)
  assert.equal(events.at(-1).detail.action, "backup")
  assert.deepEqual(
    events.at(-1).detail.keys.sort(),
    [storage.STORAGE_KEYS.MISTAKES, storage.STORAGE_KEYS.USER_PROFILE].sort()
  )

  store.restoreLearningBackup(backup)
  assert.equal(events.at(-1).detail.action, "restore")
  assert.deepEqual(events.at(-1).detail.keys, store.getLearningBackupKeys())

  store.resetLearningData()
  assert.equal(events.at(-1).detail.action, "reset")
  assert.deepEqual(events.at(-1).detail.keys, store.getLearningBackupKeys())
})

test("parseLearningBackup rejects invalid JSON and wrong versions", () => {
  assert.equal(store.parseLearningBackup("not json"), null)
  assert.equal(store.parseLearningBackup(JSON.stringify({ version: 999, exportedAt: 1, entries: {} })), null)
  assert.deepEqual(
    store.parseLearningBackup(JSON.stringify({ version: store.LEARNING_BACKUP_VERSION, exportedAt: 1, entries: {} })),
    { version: store.LEARNING_BACKUP_VERSION, exportedAt: 1, entries: {} }
  )
})
