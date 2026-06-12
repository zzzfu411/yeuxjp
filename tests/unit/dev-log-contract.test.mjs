import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("recoverable runtime warnings go through the shared development logger", () => {
  const devLog = read("src/lib/dev-log.ts")
  const runtimeSources = [
    "src/components/pwa-register.tsx",
    "src/lib/kana-progress.ts",
    "src/lib/learning-storage.ts",
    "src/lib/mistake-notebook-storage.ts",
    "src/lib/progress-list-storage.ts",
    "src/lib/srs-storage.ts",
    "src/lib/vocab-progress.ts",
  ]

  assert.match(devLog, /console\.warn\(message, \.\.\.args\)/)

  for (const relPath of runtimeSources) {
    const source = read(relPath)
    assert.match(source, /warnInDevelopment/)
    assert.doesNotMatch(source, /console\.warn/)
  }
})
