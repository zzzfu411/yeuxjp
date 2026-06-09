import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("learning progress records practice from current storage snapshots", () => {
  const source = read("src/lib/learning-progress.ts")

  assert.match(source, /appendPracticeResult\(readLearningJson\(STORAGE_KEYS\.PRACTICE_RESULTS, \[\]\), result, createdAt\)/)
  assert.match(source, /updateItemProgressForPractice\(readLearningJson\(STORAGE_KEYS\.ITEM_PROGRESS, \{\}\), nextResult\)/)
  assert.doesNotMatch(source, /\[\.\.\.prev, nextResult\]\.slice\(-300\)/)
  assert.doesNotMatch(source, /createItemProgress\(result\.itemId/)
})
