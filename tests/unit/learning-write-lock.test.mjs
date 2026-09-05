import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const { runLearningWrite } = await loadTsModule("src/lib/learning-write-lock.ts")
const { writeManagedLearningStorage } = await loadTsModule("src/lib/managed-learning-storage.ts")
const { STORAGE_KEYS, LEARNING_WRITE_EPOCH_KEY } = await loadTsModule("src/lib/storage-keys.ts")

function environment(t) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator")
  const data = new Map()
  let queue = Promise.resolve()
  const locks = { request: (_name, _options, callback) => {
    const task = queue.then(callback)
    queue = task.catch(() => {})
    return task
  } }
  const window = Object.assign(new EventTarget(), {
    document: {}, setTimeout, clearTimeout,
    localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) },
  })
  Object.defineProperty(globalThis, "window", { configurable: true, value: window })
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks } })
  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else delete globalThis.window
    if (previousNavigator) Object.defineProperty(globalThis, "navigator", previousNavigator)
    else delete globalThis.navigator
  })
  return { data, locks, window }
}

test("concurrent operations read after acquiring the lock and keep all updates", async t => {
  const { data } = environment(t)
  const key = STORAGE_KEYS.KANA_MASTERED
  const results = await Promise.all(Array.from({ length: 50 }, (_, n) => runLearningWrite(() => {
    const previous = JSON.parse(window.localStorage.getItem(key) ?? "[]")
    return writeManagedLearningStorage(key, JSON.stringify([...previous, n]))
  })))
  assert.ok(results.every(Boolean))
  assert.deepEqual(JSON.parse(data.get(key)), Array.from({ length: 50 }, (_, n) => n))
  assert.throws(() => writeManagedLearningStorage(key, "[]"), /require runLearningWrite/)
})

test("data replacement invalidates already queued writes without resurrecting old data", async t => {
  const { data } = environment(t)
  const reset = runLearningWrite(() => { data.delete(STORAGE_KEYS.PRACTICE_RESULTS); return true }, { replacesData: true })
  let ran = false
  const stale = runLearningWrite(() => { ran = true; return writeManagedLearningStorage(STORAGE_KEYS.PRACTICE_RESULTS, "[]") })
  assert.equal(await reset, true)
  assert.equal(await stale, false)
  assert.equal(ran, false)
  assert.equal(data.has(STORAGE_KEYS.PRACTICE_RESULTS), false)
  assert.ok(data.get(LEARNING_WRITE_EPOCH_KEY))
  assert.equal(await runLearningWrite(() => writeManagedLearningStorage(STORAGE_KEYS.PRACTICE_RESULTS, "[]")), true)
})

test("failed replacements restore their epoch and failed commits release the lock", async t => {
  const { data } = environment(t)
  data.set(LEARNING_WRITE_EPOCH_KEY, "original")
  assert.equal(await runLearningWrite(() => false, { replacesData: true }), false)
  assert.equal(data.get(LEARNING_WRITE_EPOCH_KEY), "original")
  assert.equal(await runLearningWrite(() => { throw Error("storage fault") }, { replacesData: true }), false)
  assert.equal(data.get(LEARNING_WRITE_EPOCH_KEY), "original")
  assert.equal(await runLearningWrite(() => writeManagedLearningStorage(STORAGE_KEYS.KANA_MASTERED, "[]")), true)
})

test("unsupported locking fails explicitly without executing a write", async t => {
  const { locks, window } = environment(t)
  locks.request = undefined
  let reason, ran = false
  window.addEventListener("yasashi:learning-write:error", event => { reason = event.detail })
  assert.equal(await runLearningWrite(() => { ran = true; return true }), false)
  assert.equal(reason, "unsupported")
  assert.equal(ran, false)
})
