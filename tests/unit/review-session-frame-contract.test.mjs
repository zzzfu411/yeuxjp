import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

function reviewSessionSources() {
  return [
    read("src/components/review/review-runner.tsx"),
    read("src/components/review/today-review-session.tsx"),
    read("src/components/review/kana-review-session.tsx"),
    read("src/components/review/vocab-review-session.tsx"),
    read("src/components/review/mistake-review-session.tsx"),
  ].join("\n")
}

test("review sessions delegate repeated session chrome to frame components", () => {
  const source = reviewSessionSources()

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
  assert.match(source, /testId\?: string/)
  assert.match(source, /data-testid=\{testId\}/)
  assert.match(source, /<ArrowLeft\b/)
  assert.match(source, /<RefreshCw\b/)
  assert.match(source, /ReviewPromptCard/)
  assert.match(source, /ReviewNextButton/)
  assert.match(source, /data-testid="review-next"/)
})

test("mistake review session exposes a stable browser test id", () => {
  const source = read("src/components/review/mistake-review-session.tsx")

  assert.match(source, /testId="mistake-review-session"/)
})

test("review sessions delegate repeated queue state to useReviewSessionState", () => {
  const source = reviewSessionSources()

  assert.equal(source.match(/useReviewSessionState\(/g)?.length, 4)
  assert.equal(source.match(/review\.isInvalidated/g)?.length, 8)
  assert.doesNotMatch(source, /review\.queue/)
  assert.doesNotMatch(source, /setQueue/)
  assert.doesNotMatch(source, /advanceReviewQueue/)
  assert.doesNotMatch(source, /recordReviewAnswer/)
  assert.doesNotMatch(source, /createReviewStats/)
})
