import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates mistake deck sessions to MistakeReviewSession", () => {
  const runner = read("src/components/review/review-runner.tsx")

  assert.match(runner, /from "@\/components\/review\/mistake-review-session"/)
  assert.match(runner, /<MistakeReviewSession ids=\{ids\}/)
  assert.doesNotMatch(runner, /function MistakeReviewSession/)
  assert.doesNotMatch(runner, /notebook\.remove\(item\.id\)/)
  assert.doesNotMatch(runner, /<MistakeReviewPrompt\b/)
  assert.doesNotMatch(runner, /showSpecialFeedback/)
})

test("MistakeReviewSession owns mistake question conversion, removal, feedback, and SRS grading", () => {
  const source = read("src/components/review/mistake-review-session.tsx")

  assert.match(source, /export function MistakeReviewSession/)
  assert.match(source, /useReviewSessionState\(ids\)/)
  assert.match(source, /mistakeToQuestion\(item\)/)
  assert.match(source, /const handleRemove = \(\) => \{/)
  assert.match(source, /const removed = notebook\.remove\(item\.id\)/)
  assert.match(source, /setSaveErrorId\(removed \? null : item\.id\)/)
  assert.match(source, /if \(removed\) review\.dropCurrent\(\)/)
  assert.match(source, /onClick=\{handleRemove\}/)
  assert.match(source, /<MistakeReviewPrompt\b/)
  assert.match(source, /<ReviewAnswerFeedback/)
  assert.match(source, /showSpecialFeedback/)
  assert.match(source, /if \(!item\) return false/)
  assert.match(source, /return srs\.has\(item\.id\)/)
  assert.match(source, /return srs\.gradeExisting\(item\.id/)
  assert.match(source, /const saveError = !!currentId && saveErrorId === currentId/)
  assert.match(source, /setSaveErrorId\(recorded \? null : item\.id\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
})
