import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates vocab deck sessions to VocabReviewSession", () => {
  const runner = read("src/components/review/review-runner.tsx")

  assert.match(runner, /from "@\/components\/review\/vocab-review-session"/)
  assert.match(runner, /<VocabReviewSession ids=\{ids\}/)
  assert.doesNotMatch(runner, /function VocabReviewSession/)
  assert.doesNotMatch(runner, /makeVocabReviewQuestion\(item\.id, vocabulary\.data\)/)
  assert.doesNotMatch(runner, /<VocabReviewPrompt\b/)
  assert.doesNotMatch(runner, /useVocabularyForReviewIds/)
})

test("VocabReviewSession owns vocabulary loading, prompt, question, and SRS grading", () => {
  const source = read("src/components/review/vocab-review-session.tsx")

  assert.match(source, /export function VocabReviewSession/)
  assert.match(source, /useVocabularyForReviewIds\(ids, ids\.length > 0\)/)
  assert.match(source, /useReviewSessionState\(ids\)/)
  assert.match(source, /makeVocabReviewQuestion\(item\.id, vocabulary\.data\)/)
  assert.match(source, /<VocabReviewPrompt\b/)
  assert.match(source, /ReviewLoadingState/)
  assert.match(source, /if \(!item\) return false/)
  assert.match(source, /return srs\.grade\(item\.id/)
  assert.match(source, /setSaveError\(!recorded\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
})
