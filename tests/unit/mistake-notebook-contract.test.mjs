import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("mistake notebook hook delegates model and storage logic", () => {
  const source = read("src/lib/mistake-notebook.ts")

  assert.match(source, /from "@\/lib\/mistake-notebook-model"/)
  assert.match(source, /from "@\/lib\/mistake-notebook-storage"/)
  assert.match(source, /MISTAKE_NOTEBOOK_EVENT/)
  assert.match(source, /notifyMistakeNotebook/)
  assert.match(source, /runLearningStorageTransaction/)
  assert.match(source, /const previous = readMistakeList\(storageKey\)/)
  assert.match(source, /upsertWrongMistake\(previous, input, now\)/)
  assert.match(source, /removeMistakeById\(previous, id\)/)
  assert.match(source, /gradeSrs\(MISTAKE_SRS_STORAGE_KEY, id, "again", now\)/)
  assert.match(source, /removeSrs\(MISTAKE_SRS_STORAGE_KEY, id\)/)
  assert.match(source, /clearSrs\(MISTAKE_SRS_STORAGE_KEY\)/)
  assert.match(source, /return true/)
  assert.match(source, /return false/)
  assert.match(source, /writeMistakeList\(storageKey, next\)/)
  assert.match(source, /window\.addEventListener\(MISTAKE_NOTEBOOK_EVENT, onMistakeNotebook\)/)
  assert.match(source, /window\.removeEventListener\(MISTAKE_NOTEBOOK_EVENT, onMistakeNotebook\)/)
  assert.match(source, /notifyMistakeNotebook\(storageKey\)/)
  assert.match(source, /const saved = runLearningStorageTransaction/)
  assert.match(source, /if \(!saved\) return false/)
  assert.doesNotMatch(source, /readSrsMap/)
  assert.doesNotMatch(source, /writeSrsMap/)
  assert.doesNotMatch(source, /notifySrs/)
  assert.doesNotMatch(source, /createSrsState/)
  assert.doesNotMatch(source, /applySrsResult/)
  assert.doesNotMatch(source, /window\.localStorage/)
  assert.doesNotMatch(source, /JSON\.parse/)
})

test("question and review pure logic import mistake types from the model", () => {
  assert.match(read("src/lib/questions.ts"), /from "@\/lib\/mistake-notebook-model"/)
  assert.match(read("src/lib/review-questions.ts"), /from "@\/lib\/mistake-notebook-model"/)
})
