import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

test("vocabulary page loads the active level through the dynamic loader", () => {
  const source = fs.readFileSync(path.join(root, "src/app/vocabulary/page.tsx"), "utf8")

  assert.match(source, /loadVocabularyLevel/)
  assert.doesNotMatch(source, /vocabByLevel/)
  assert.doesNotMatch(source, /from\s+["']@\/data\/vocabulary["']/)
})
