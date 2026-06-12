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

  assert.match(source, /const previousResults = normalizePracticeResults\(readLearningJson\(STORAGE_KEYS\.PRACTICE_RESULTS, \[\]\)\)/)
  assert.match(source, /const previousItems = normalizeItemProgressMap\(readLearningJson\(STORAGE_KEYS\.ITEM_PROGRESS, \{\}\)\)/)
  assert.match(source, /appendPracticeResult\(previousResults, result, createdAt\)/)
  assert.match(source, /updateItemProgressForPractice\(previousItems, nextResult\)/)
  assert.doesNotMatch(source, /\[\.\.\.prev, nextResult\]\.slice\(-300\)/)
  assert.doesNotMatch(source, /createItemProgress\(result\.itemId/)
})

test("learning progress treats practice history and item progress as one write", () => {
  const source = read("src/lib/learning-progress.ts")

  assert.match(source, /if \(!nextResult\) return false/)
  assert.match(source, /runLearningStorageTransaction/)
  assert.match(source, /const saved = runLearningStorageTransaction\(\(\) => \{/)
  assert.match(source, /writeLearningJson\(STORAGE_KEYS\.PRACTICE_RESULTS, nextResults\) && writeLearningJson\(STORAGE_KEYS\.ITEM_PROGRESS, nextItems\)/)
  assert.match(source, /if \(!saved\) return false/)
  assert.match(source, /setResults\(nextResults\)/)
  assert.match(source, /setItems\(nextItems\)/)
  assert.match(source, /return true/)
})
