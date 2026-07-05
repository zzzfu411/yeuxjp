import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const storage = await loadTsModule("src/lib/storage-keys.ts")
const store = await loadTsModule("src/lib/learning-store.ts")

function listSourceFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(absPath))
      continue
    }
    if (/\.(ts|tsx)$/.test(entry.name)) files.push(absPath)
  }
  return files
}

function listFiles(dir, pattern) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFiles(absPath, pattern))
      continue
    }
    if (pattern.test(entry.name)) files.push(absPath)
  }
  return files
}

test("storage keys stay unique and versioned under the yasashi namespace", () => {
  const entries = Object.entries(storage.STORAGE_KEYS)
  const values = entries.map(([, value]) => value)

  assert.equal(values.length, new Set(values).size, "storage key values should be unique")

  for (const [name, value] of entries) {
    assert.match(name, /^[A-Z0-9_]+$/, `${name} should remain an enum-style key name`)
    assert.match(value, /^yasashi\.[a-z0-9.]+\.v1$/, `${name} should use the yasashi.*.v1 storage namespace`)
    assert.doesNotMatch(value, /\.\./, `${name} should not contain empty namespace segments`)
  }
})

test("learning-store backup keys are declared storage keys and cover local learning state", () => {
  const declaredKeys = Object.values(storage.STORAGE_KEYS).sort()
  const backupKeys = store.getLearningBackupKeys().sort()

  assert.equal(backupKeys.length, new Set(backupKeys).size, "backup keys should not contain duplicates")
  for (const key of backupKeys) {
    assert.ok(declaredKeys.includes(key), `${key} should be declared in STORAGE_KEYS`)
  }
  assert.deepEqual(backupKeys, declaredKeys)
})

test("runtime source imports STORAGE_KEYS instead of hard-coding versioned localStorage keys", () => {
  const storageKeysPath = path.normalize(path.join(root, "src", "lib", "storage-keys.ts"))
  const hardCodedStorageKey = /["'`]yasashi\.[a-z0-9.-]+\.v1["'`]/g

  for (const absPath of listSourceFiles(path.join(root, "src"))) {
    if (path.normalize(absPath) === storageKeysPath) continue

    const source = fs.readFileSync(absPath, "utf8")
    const matches = source.match(hardCodedStorageKey) ?? []
    assert.deepEqual(
      matches,
      [],
      `${path.relative(root, absPath)} should import STORAGE_KEYS instead of hard-coding storage key strings`
    )
  }
})

test("runtime source writes managed learning storage only through the managed helper", () => {
  const allowedDirectWriteFiles = new Set([
    path.normalize(path.join(root, "src", "lib", "managed-learning-storage.ts")),
  ])
  const directStorageWrite = /(?:window\.)?localStorage\.(?:setItem|removeItem|clear)\s*\(/g

  for (const absPath of listSourceFiles(path.join(root, "src"))) {
    if (allowedDirectWriteFiles.has(path.normalize(absPath))) continue

    const source = fs.readFileSync(absPath, "utf8")
    const matches = source.match(directStorageWrite) ?? []
    assert.deepEqual(
      matches,
      [],
      `${path.relative(root, absPath)} should write localStorage through managed-learning-storage helpers`
    )
  }
})

test("tests centralize versioned learning storage key strings", () => {
  const allowedFiles = new Set([
    path.normalize(path.join(root, "tests", "e2e", "storage-keys.mjs")),
    path.normalize(path.join(root, "tests", "unit", "storage-keys-contract.test.mjs")),
  ])
  const hardCodedStorageKey = /["'`]yasashi\.[a-z0-9.-]+\.v1["'`]/g

  for (const absPath of listFiles(path.join(root, "tests"), /\.(mjs|js|ts|tsx)$/)) {
    if (allowedFiles.has(path.normalize(absPath))) continue

    const source = fs.readFileSync(absPath, "utf8")
    const matches = source.match(hardCodedStorageKey) ?? []
    assert.deepEqual(
      matches,
      [],
      `${path.relative(root, absPath)} should import STORAGE_KEYS or E2E_STORAGE_KEYS instead of hard-coding storage key strings`
    )
  }
})
