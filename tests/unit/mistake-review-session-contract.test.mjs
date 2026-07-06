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

  assert.match(runner, /import dynamic from "next\/dynamic"/)
  assert.match(runner, /import\("@\/components\/review\/mistake-review-session"\)/)
  assert.match(runner, /const MistakeReviewSession = dynamic\(/)
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
  assert.match(source, /const \{ dropCurrent \} = review/)
  assert.match(source, /useEffect\(\(\) => \{/)
  assert.match(source, /if \(!currentId \|\| item\) return/)
  assert.match(source, /queueMicrotask\(\(\) => \{/)
  assert.match(source, /setSaveErrorId\(null\)/)
  assert.match(source, /dropCurrent\(\)/)
  assert.match(source, /cancelled = true/)
  assert.match(source, /if \(!item\) return null/)
  assert.doesNotMatch(source, /错题不存在/)
  assert.match(source, /mistakeToQuestion\(item\)/)
  assert.match(source, /const handleRemove = \(\) => \{/)
  assert.match(source, /const removed = notebook\.remove\(item\.id\)/)
  assert.match(source, /setSaveErrorId\(removed \? null : item\.id\)/)
  assert.match(source, /if \(removed\) dropCurrent\(\)/)
  assert.match(source, /onClick=\{handleRemove\}/)
  assert.match(source, /<MistakeReviewPrompt\b/)
  assert.match(source, /<ReviewAnswerFeedback/)
  assert.match(source, /showSpecialFeedback/)
  assert.match(source, /if \(!item\) return false/)
  assert.match(source, /return srs\.has\(item\.id\)/)
  assert.match(source, /if \(!result\.correct\) return true/)
  assert.match(source, /return srs\.gradeExisting\(item\.id, "good"\)/)
  assert.match(source, /const saveError = !!currentId && saveErrorId === currentId/)
  assert.match(source, /setSaveErrorId\(recorded \? null : item\.id\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
})
