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
    read("src/components/review/kana-review-session.tsx"),
    read("src/components/review/vocab-review-session.tsx"),
    read("src/components/review/today-review-session.tsx"),
    read("src/components/review/mistake-review-session.tsx"),
  ].join("\n")
}

test("review sessions delegate answer explanation surfaces to ReviewAnswerFeedback", () => {
  const source = reviewSessionSources()

  assert.equal(source.match(/<ReviewAnswerFeedback\b/g)?.length, 4)
  assert.doesNotMatch(source, /ParticleFillFeedback/)
  assert.doesNotMatch(source, /ConjugationComparison/)
  assert.doesNotMatch(source, /canShowConj/)
  assert.doesNotMatch(source, /selectedDisplay/)
  assert.doesNotMatch(source, /correctDisplay/)
})

test("ReviewAnswerFeedback owns generic, particle, and conjugation feedback", () => {
  const source = read("src/components/review/review-answer-feedback.tsx")

  assert.match(source, /export function ReviewAnswerFeedback/)
  assert.match(source, /ParticleFillFeedback/)
  assert.match(source, /ConjugationComparison/)
  assert.match(source, /showSelectedAnswer/)
  assert.match(source, /showSpecialFeedback/)
  assert.match(source, /role="status"/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /correct === true/)
  assert.match(source, /acceptedAnswers=\{question\.acceptedAnswers\}/)
  assert.match(source, /correctDisplay/)
})
