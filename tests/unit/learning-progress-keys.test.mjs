import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const keys = await loadTsModule("src/lib/learning-progress-keys.ts")
const storage = await loadTsModule("src/lib/storage-keys.ts")

test("learning progress key helpers classify profile and progress storage updates", () => {
  assert.equal(keys.isProfileStorageKey(storage.STORAGE_KEYS.USER_PROFILE), true)
  assert.equal(keys.isProfileStorageKey(storage.STORAGE_KEYS.LESSON_PROGRESS), false)
  assert.equal(keys.isProfileStorageKey(null), false)

  assert.equal(keys.isProgressStorageKey(storage.STORAGE_KEYS.LESSON_PROGRESS), true)
  assert.equal(keys.isProgressStorageKey(storage.STORAGE_KEYS.ITEM_PROGRESS), true)
  assert.equal(keys.isProgressStorageKey(storage.STORAGE_KEYS.PRACTICE_RESULTS), true)
  assert.equal(keys.isProgressStorageKey(storage.STORAGE_KEYS.USER_PROFILE), false)
  assert.equal(keys.isProgressStorageKey(undefined), false)

  assert.equal(
    keys.includesProgressStorageKey([storage.STORAGE_KEYS.USER_PROFILE, storage.STORAGE_KEYS.PRACTICE_RESULTS]),
    true
  )
  assert.equal(keys.includesProgressStorageKey([storage.STORAGE_KEYS.USER_PROFILE]), false)
  assert.equal(keys.includesProgressStorageKey(undefined), false)
})
