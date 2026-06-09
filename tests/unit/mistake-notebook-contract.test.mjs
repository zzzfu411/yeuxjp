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
  assert.match(source, /const previous = readMistakeList\(storageKey\)/)
  assert.match(source, /upsertWrongMistake\(previous, input, now\)/)
  assert.match(source, /removeMistakeById\(previous, id\)/)
  assert.match(source, /if \(!setSrsState\(MISTAKE_SRS_STORAGE_KEY/)
  assert.match(source, /if \(!removeSrs\(MISTAKE_SRS_STORAGE_KEY, id\)\) return/)
  assert.match(source, /if \(!clearSrs\(MISTAKE_SRS_STORAGE_KEY\)\) return/)
  assert.match(source, /const previousSrs = readSrsMap\(MISTAKE_SRS_STORAGE_KEY\)/)
  assert.match(source, /writeSrsMap\(MISTAKE_SRS_STORAGE_KEY, previousSrs\)/)
  assert.match(source, /notifySrs\(MISTAKE_SRS_STORAGE_KEY\)/)
  assert.match(source, /writeMistakeList\(storageKey, next\)/)
  assert.doesNotMatch(source, /window\.localStorage/)
  assert.doesNotMatch(source, /JSON\.parse/)
})

test("question and review pure logic import mistake types from the model", () => {
  assert.match(read("src/lib/questions.ts"), /from "@\/lib\/mistake-notebook-model"/)
  assert.match(read("src/lib/review-questions.ts"), /from "@\/lib\/mistake-notebook-model"/)
})
