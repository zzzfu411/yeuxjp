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

  assert.match(source, /const previousResultsResult = readPracticeResultsResult\(\)/)
  assert.match(source, /const previousItemsResult = readItemProgressMapResult\(\)/)
  assert.match(source, /if \(!previousResultsResult\.ok \|\| !previousItemsResult\.ok\) return false/)
  assert.match(source, /const previousResults = previousResultsResult\.value/)
  assert.match(source, /const previousItems = previousItemsResult\.value/)
  assert.match(source, /appendPracticeResult\(previousResults, result, createdAt\)/)
  assert.match(source, /updateItemProgressForPractice\(previousItems, nextResult\)/)
  assert.doesNotMatch(source, /\[\.\.\.prev, nextResult\]\.slice\(-300\)/)
  assert.doesNotMatch(source, /createItemProgress\(result\.itemId/)
})

test("learning progress treats practice history and item progress as one write", () => {
  const source = read("src/lib/learning-progress.ts")

  assert.match(source, /if \(!nextResult\) return false/)
  assert.match(source, /runLearningStorageTransaction/)
  assert.match(source, /queueLearningNotification/)
  assert.match(source, /const saved = runLearningStorageTransaction\(\(\) => \{/)
  assert.match(source, /writeLearningJson\([\s\S]*STORAGE_KEYS\.PRACTICE_RESULTS,[\s\S]*expectedRaw: previousResultsResult\.raw/)
  assert.match(source, /writeLearningJson\([\s\S]*STORAGE_KEYS\.ITEM_PROGRESS,[\s\S]*expectedRaw: previousItemsResult\.raw/)
  assert.match(source, /if \(wrote\) \{/)
  assert.match(source, /queueLearningNotification\(\(\) => \{/)
  assert.match(source, /setResults\(nextResults\)/)
  assert.match(source, /setItems\(nextItems\)/)
  assert.match(source, /queueLearningNotification\(\(\) => setLessons\(next\)\)/)
  assert.match(source, /if \(!saved\) return false/)
  assert.match(source, /return true/)
})
