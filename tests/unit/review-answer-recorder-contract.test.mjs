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

test("review sessions delegate shared answer recording to useReviewAnswerRecorder", () => {
  const source = reviewSessionSources()

  assert.equal(source.match(/useReviewAnswerRecorder\(/g)?.length, 4)
  assert.doesNotMatch(source, /makeQuestionResult/)
  assert.doesNotMatch(source, /recordQuestionPractice/)
  assert.doesNotMatch(source, /review\.recordAnswer\(/)
})

test("review sessions reuse shared kana and vocab review question builders", () => {
  const source = reviewSessionSources()

  assert.match(source, /makeKanaReviewQuestion\(item\.romaji\)/)
  assert.match(source, /makeVocabReviewQuestion\(item\.id, vocabulary\.data\)/)
  assert.doesNotMatch(source, /const question: Question =/)
  assert.doesNotMatch(source, /options: options\.map/)
  assert.doesNotMatch(source, /shuffleList/)
})

test("useReviewAnswerRecorder owns question result and learning record writes", () => {
  const source = read("src/components/review/use-review-answer-recorder.ts")

  assert.match(source, /makeQuestionResult/)
  assert.match(source, /recordAnswer\(selectedAnswer, result\.correct, \(\) => recordQuestionPractice\(\{ progress, notebook, result \}\)\)/)
  assert.match(source, /grade\(result\)/)
  assert.match(source, /return true/)
})

test("useReviewSessionState supports a before-commit guard for persisted answer writes", () => {
  const source = read("src/components/review/use-review-session-state.ts")

  assert.match(source, /useRef\(false\)/)
  assert.match(source, /beforeCommit\?: \(\) => boolean/)
  assert.match(source, /selectedAnswer != null \|\| answerPendingRef\.current/)
  assert.match(source, /if \(beforeCommit && !beforeCommit\(\)\) \{/)
  assert.match(source, /answerPendingRef\.current = false/)
})
