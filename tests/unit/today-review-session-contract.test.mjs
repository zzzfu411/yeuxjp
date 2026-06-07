import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates today deck sessions to TodayReviewSession", () => {
  const runner = read("src/components/review/review-runner.tsx")

  assert.match(runner, /from "@\/components\/review\/today-review-session"/)
  assert.match(runner, /<TodayReviewSession/)
  assert.match(runner, /kanaSrs=\{kanaSrs\}/)
  assert.match(runner, /vocabSrs=\{vocabSrs\}/)
  assert.match(runner, /mistakeSrs=\{mistakeSrs\}/)
  assert.doesNotMatch(runner, /makeKanaReviewQuestion/)
  assert.doesNotMatch(runner, /makeVocabReviewQuestion/)
  assert.doesNotMatch(runner, /mistakeToQuestion\(item\)/)
  assert.doesNotMatch(runner, /useAllVocabulary/)
})

test("TodayReviewSession owns mixed queue data, shared prompts, and all SRS deck grading", () => {
  const source = read("src/components/review/today-review-session.tsx")

  assert.match(source, /export function TodayReviewSession/)
  assert.match(source, /useReviewSessionState\(items\)/)
  assert.match(source, /useAllVocabulary\(needsVocabulary\)/)
  assert.match(source, /makeKanaReviewQuestion\(current\.id\)/)
  assert.match(source, /makeVocabReviewQuestion\(current\.id, vocabulary\.data\)/)
  assert.match(source, /mistakeToQuestion\(item\)/)
  assert.match(source, /<MixedReviewPrompt\b/)
  assert.match(source, /<ReviewAnswerFeedback/)
  assert.match(source, /kanaSrs\.grade\(current\.id/)
  assert.match(source, /vocabSrs\.grade\(current\.id/)
  assert.match(source, /mistakeSrs\.grade\(current\.id/)
  assert.match(source, /data-testid="review-remaining"/)
})
