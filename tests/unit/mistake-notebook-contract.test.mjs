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
  assert.match(source, /upsertWrongMistake\(listRef\.current, input, now\)/)
  assert.match(source, /writeMistakeList\(storageKey, next\)/)
  assert.match(source, /setSrsState\(MISTAKE_SRS_STORAGE_KEY/)
  assert.doesNotMatch(source, /window\.localStorage/)
  assert.doesNotMatch(source, /JSON\.parse/)
})

test("question and review pure logic import mistake types from the model", () => {
  assert.match(read("src/lib/questions.ts"), /from "@\/lib\/mistake-notebook-model"/)
  assert.match(read("src/lib/review-questions.ts"), /from "@\/lib\/mistake-notebook-model"/)
})
