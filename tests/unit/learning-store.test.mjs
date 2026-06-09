import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const store = await loadTsModule("src/lib/learning-store.ts")
const storage = await loadTsModule("src/lib/storage-keys.ts")
const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

function installWindow({ failSetKeys = new Set(), failRemoveKeys = new Set(), failOnce = false } = {}) {
  const map = new Map()
  const events = []
  const failedSetKeys = new Set()
  const failedRemoveKeys = new Set()
  global.window = {
    localStorage: {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => {
        if (failSetKeys.has(key) && (!failOnce || !failedSetKeys.has(key))) {
          failedSetKeys.add(key)
          throw new Error(`set failed: ${key}`)
        }
        map.set(key, String(value))
      },
      removeItem: (key) => {
        if (failRemoveKeys.has(key) && (!failOnce || !failedRemoveKeys.has(key))) {
          failedRemoveKeys.add(key)
          throw new Error(`remove failed: ${key}`)
        }
        map.delete(key)
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

test("restoreLearningBackup rolls back partial writes when a managed key fails", () => {
  const { map, events } = installWindow({ failSetKeys: new Set([storage.STORAGE_KEYS.SRS_KANA]), failOnce: true })
  map.set(storage.STORAGE_KEYS.USER_PROFILE, "before-profile")
  map.set(storage.STORAGE_KEYS.SRS_KANA, "before-kana")
  const backup = {
    version: store.LEARNING_BACKUP_VERSION,
    exportedAt: 123,
    entries: {
      [storage.STORAGE_KEYS.USER_PROFILE]: "after-profile",
      [storage.STORAGE_KEYS.SRS_KANA]: "after-kana",
    },
  }

  assert.equal(store.restoreLearningBackup(backup), false)
  assert.equal(map.get(storage.STORAGE_KEYS.USER_PROFILE), "before-profile")
  assert.equal(map.get(storage.STORAGE_KEYS.SRS_KANA), "before-kana")
  assert.equal(events.length, 0)
})

test("resetLearningData rolls back partial removals when a managed key fails", () => {
  const { map, events } = installWindow({ failRemoveKeys: new Set([storage.STORAGE_KEYS.SRS_KANA]), failOnce: true })
  map.set(storage.STORAGE_KEYS.USER_PROFILE, "profile")
  map.set(storage.STORAGE_KEYS.SRS_KANA, "kana")
  map.set("unrelated", "keep")

  assert.equal(store.resetLearningData(), false)
  assert.equal(map.get(storage.STORAGE_KEYS.USER_PROFILE), "profile")
  assert.equal(map.get(storage.STORAGE_KEYS.SRS_KANA), "kana")
  assert.equal(map.get("unrelated"), "keep")
  assert.equal(events.length, 0)
})

test("parseLearningBackup rejects invalid JSON and wrong versions", () => {
  assert.equal(store.parseLearningBackup("not json"), null)
  assert.equal(store.parseLearningBackup(JSON.stringify({ version: 999, exportedAt: 1, entries: {} })), null)
  assert.equal(store.parseLearningBackup(JSON.stringify({ version: store.LEARNING_BACKUP_VERSION, exportedAt: null, entries: {} })), null)
  assert.deepEqual(
    store.parseLearningBackup(JSON.stringify({ version: store.LEARNING_BACKUP_VERSION, exportedAt: 1, entries: {} })),
    { version: store.LEARNING_BACKUP_VERSION, exportedAt: 1, entries: {} }
  )
})

test("parseLearningBackup keeps only managed string entries", () => {
  const parsed = store.parseLearningBackup(JSON.stringify({
    version: store.LEARNING_BACKUP_VERSION,
    exportedAt: 123,
    entries: {
      [storage.STORAGE_KEYS.USER_PROFILE]: "{\"goal\":\"balanced\"}",
      [storage.STORAGE_KEYS.SRS_KANA]: { a: { box: 1 } },
      "not-yasashi": "ignore",
    },
  }))

  assert.deepEqual(parsed, {
    version: store.LEARNING_BACKUP_VERSION,
    exportedAt: 123,
    entries: {
      [storage.STORAGE_KEYS.USER_PROFILE]: "{\"goal\":\"balanced\"}",
    },
  })
})

test("learning store restore and reset snapshot managed keys before mutating", () => {
  const source = read("src/lib/learning-store.ts")

  assert.match(source, /function snapshotLearningKeys/)
  assert.match(source, /function applyLearningSnapshot/)
  assert.match(source, /const previous = snapshotLearningKeys\(\)/)
  assert.match(source, /applyLearningSnapshot\(previous\)/)
  assert.match(source, /notifyLearningStore\(\{ action: "restore", keys: BACKUP_KEYS \}\)/)
  assert.match(source, /notifyLearningStore\(\{ action: "reset", keys: BACKUP_KEYS \}\)/)
})
