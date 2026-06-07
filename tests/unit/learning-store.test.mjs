import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const store = await loadTsModule("src/lib/learning-store.ts")
const storage = await loadTsModule("src/lib/storage-keys.ts")

function installWindow() {
  const map = new Map()
  global.window = {
    localStorage: {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => map.set(key, String(value)),
      removeItem: (key) => map.delete(key),
    },
    dispatchEvent: () => true,
  }
  return map
}

test("learning backups include existing learning keys and can restore them", () => {
  const map = installWindow()
  map.set(storage.STORAGE_KEYS.USER_PROFILE, '{"goal":"balanced"}')
  map.set(storage.STORAGE_KEYS.SRS_KANA, '{"a":{"box":1}}')

  const backup = store.createLearningBackup(123)
  assert.equal(backup.version, store.LEARNING_BACKUP_VERSION)
  assert.equal(backup.exportedAt, 123)
  assert.equal(backup.entries[storage.STORAGE_KEYS.USER_PROFILE], '{"goal":"balanced"}')

  map.clear()
  assert.equal(store.restoreLearningBackup(backup), true)
  assert.equal(map.get(storage.STORAGE_KEYS.SRS_KANA), '{"a":{"box":1}}')
})

test("resetLearningData removes all managed keys but leaves unrelated localStorage alone", () => {
  const map = installWindow()
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

test("parseLearningBackup rejects invalid JSON and wrong versions", () => {
  assert.equal(store.parseLearningBackup("not json"), null)
  assert.equal(store.parseLearningBackup(JSON.stringify({ version: 999, exportedAt: 1, entries: {} })), null)
  assert.deepEqual(
    store.parseLearningBackup(JSON.stringify({ version: store.LEARNING_BACKUP_VERSION, exportedAt: 1, entries: {} })),
    { version: store.LEARNING_BACKUP_VERSION, exportedAt: 1, entries: {} }
  )
})
