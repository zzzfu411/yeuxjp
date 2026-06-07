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

test("review sessions delegate answer option rendering to ReviewOptionGrid", () => {
  const source = reviewSessionSources()

  assert.equal(source.match(/<ReviewOptionGrid\b/g)?.length, 4)
  assert.doesNotMatch(source, /getAnswerOptionFeedback/)
  assert.doesNotMatch(source, /shouldShowCorrectAnswerIcon/)
  assert.doesNotMatch(source, /shouldShowWrongAnswerIcon/)
})

test("ReviewOptionGrid owns review option feedback visuals", () => {
  const source = read("src/components/review/review-option-grid.tsx")

  assert.match(source, /getAnswerOptionFeedback/)
  assert.match(source, /getAnswerOptionClassName/)
  assert.match(source, /shouldShowCorrectAnswerIcon/)
  assert.match(source, /shouldShowWrongAnswerIcon/)
  assert.match(source, /selectedAnswer != null/)
})
