import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates repeated session chrome to frame components", () => {
  const source = read("src/components/review/review-runner.tsx")

  assert.match(source, /from "@\/components\/review\/review-session-frame"/)
  assert.equal(source.match(/<ReviewSessionFrame\b/g)?.length, 4)
  assert.equal(source.match(/<ReviewPromptCard\b/g)?.length, 4)
  assert.equal(source.match(/<ReviewNextButton\b/g)?.length, 4)
  assert.doesNotMatch(source, /container py-10 px-4 mx-auto max-w-lg/)
  assert.doesNotMatch(source, /<ArrowLeft\b/)
  assert.doesNotMatch(source, /<RefreshCw\b/)
})

test("review session frame owns shared review layout chrome", () => {
  const source = read("src/components/review/review-session-frame.tsx")

  assert.match(source, /container py-10 px-4 mx-auto max-w-lg/)
  assert.match(source, /<ArrowLeft\b/)
  assert.match(source, /<RefreshCw\b/)
  assert.match(source, /ReviewPromptCard/)
  assert.match(source, /ReviewNextButton/)
})

test("review runner delegates repeated queue state to useReviewSessionState", () => {
  const source = read("src/components/review/review-runner.tsx")

  assert.match(source, /from "@\/components\/review\/use-review-session-state"/)
  assert.equal(source.match(/useReviewSessionState\(/g)?.length, 4)
  assert.doesNotMatch(source, /review\.queue/)
  assert.doesNotMatch(source, /setQueue/)
  assert.doesNotMatch(source, /advanceReviewQueue/)
  assert.doesNotMatch(source, /recordReviewAnswer/)
  assert.doesNotMatch(source, /createReviewStats/)
})
