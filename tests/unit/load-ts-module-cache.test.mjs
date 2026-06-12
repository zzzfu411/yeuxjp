import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { cleanupStaleTestCache } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")

function touchOld(target, oldDate) {
  fs.utimesSync(target, oldDate, oldDate)
}

test("loadTsModule cache cleanup only removes stale managed entries", () => {
  const cacheRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yasashi-cache-cleanup-"))
  const now = 1_700_000_000_000
  const oldDate = new Date(now - 2 * 24 * 60 * 60 * 1000)
  const freshDate = new Date(now)
  const currentRunId = "1234-1700000000000-current"

  try {
    for (const name of [
      "1000",
      "2000-1700000000000-old",
      currentRunId,
      "node_modules",
      "next-build.lock",
      "keep-me",
      "3000-1700000000000-fresh",
    ]) {
      fs.mkdirSync(path.join(cacheRoot, name))
    }
    fs.writeFileSync(path.join(cacheRoot, "src__lib__old.mjs"), "export default 1")
    fs.writeFileSync(path.join(cacheRoot, "notes.txt"), "keep")

    for (const name of [
      "1000",
      "2000-1700000000000-old",
      currentRunId,
      "node_modules",
      "next-build.lock",
      "keep-me",
      "src__lib__old.mjs",
      "notes.txt",
    ]) {
      touchOld(path.join(cacheRoot, name), oldDate)
    }
    touchOld(path.join(cacheRoot, "3000-1700000000000-fresh"), freshDate)

    cleanupStaleTestCache({ cacheRoot, currentRunId, now })

    assert.equal(fs.existsSync(path.join(cacheRoot, "1000")), false)
    assert.equal(fs.existsSync(path.join(cacheRoot, "2000-1700000000000-old")), false)
    assert.equal(fs.existsSync(path.join(cacheRoot, "src__lib__old.mjs")), false)
    assert.equal(fs.existsSync(path.join(cacheRoot, currentRunId)), true)
    assert.equal(fs.existsSync(path.join(cacheRoot, "node_modules")), true)
    assert.equal(fs.existsSync(path.join(cacheRoot, "next-build.lock")), true)
    assert.equal(fs.existsSync(path.join(cacheRoot, "keep-me")), true)
    assert.equal(fs.existsSync(path.join(cacheRoot, "notes.txt")), true)
    assert.equal(fs.existsSync(path.join(cacheRoot, "3000-1700000000000-fresh")), true)
  } finally {
    fs.rmSync(cacheRoot, { recursive: true, force: true })
  }
})

test("loadTsModule cleans both current temp cache and legacy project cache", () => {
  const source = fs.readFileSync(path.join(root, "tests/unit/load-ts-module.mjs"), "utf8")

  assert.match(source, /const legacyProjectCacheRoot = path\.join\(root, "\.test-cache"\)/)
  assert.match(source, /cleanupStaleTestCache\(\{ cacheRoot: legacyProjectCacheRoot \}\)/)
})
