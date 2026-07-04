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
  assert.match(source, /makeVocabReviewQuestion\(item, vocabulary\.data\)/)
  assert.doesNotMatch(source, /makeVocabReviewQuestion\(item\.id, vocabulary\.data\)/)
  assert.doesNotMatch(source, /const question: Question =/)
  assert.doesNotMatch(source, /options: options\.map/)
  assert.doesNotMatch(source, /shuffleList/)
})

test("useReviewAnswerRecorder owns question result and learning record writes", () => {
  const source = read("src/components/review/use-review-answer-recorder.ts")

  assert.match(source, /makeQuestionResult/)
  assert.match(source, /runLearningStorageTransaction/)
  assert.match(source, /recordQuestionPracticeWithoutTransaction/)
  assert.match(source, /canRecord\?: \(result: QuestionResult\) => boolean/)
  assert.match(source, /if \(canRecord && !canRecord\(result\)\) return false/)
  assert.match(source, /enrollReviewOnCorrect: false/)
  assert.match(source, /return grade\(result\)/)
  assert.doesNotMatch(source, /result\.question\.mistakeId && !result\.correct/)
  assert.match(source, /recordAnswer\(selectedAnswer, result\.correct, \(\) => \{/)
  assert.match(source, /return true/)
})

test("review sessions require existing SRS records before grading queued items", () => {
  const source = reviewSessionSources()

  assert.match(source, /canRecord: useCallback/)
  assert.match(source, /srs\.has\(item\.romaji\)/)
  assert.match(source, /srs\.has\(item\.id\)/)
  assert.match(source, /kanaSrs\.has\(current\.id\)/)
  assert.match(source, /vocabSrs\.has\(current\.id\)/)
  assert.match(source, /mistakeSrs\.has\(current\.id\)/)
  assert.match(source, /srs\.gradeExisting\(item\.romaji/)
  assert.match(source, /srs\.gradeExisting\(item\.id/)
  assert.match(source, /kanaSrs\.gradeExisting\(current\.id/)
  assert.match(source, /vocabSrs\.gradeExisting\(current\.id/)
  assert.match(source, /mistakeSrs\.gradeExisting\(current\.id/)
})

test("useReviewSessionState supports a before-commit guard for persisted answer writes", () => {
  const source = read("src/components/review/use-review-session-state.ts")

  assert.match(source, /useRef\(false\)/)
  assert.match(source, /beforeCommit\?: \(\) => boolean/)
  assert.match(source, /selectedAnswer != null \|\| answerPendingRef\.current/)
  assert.match(source, /if \(beforeCommit && !beforeCommit\(\)\) \{/)
  assert.match(source, /answerPendingRef\.current = false/)
  assert.match(source, /addLearningStoreListener/)
  assert.match(source, /shouldInvalidateReviewSession\(detail\.action, detail\.keys\)/)
  assert.match(source, /shouldInvalidateReviewSession\("storage", event\.key \? \[event\.key\] : \[\]\)/)
  assert.match(source, /const removeLearningStoreListener = addLearningStoreListener/)
  assert.match(source, /window\.addEventListener\("storage", onStorage\)/)
  assert.match(source, /window\.removeEventListener\("storage", onStorage\)/)
  assert.match(source, /const invalidate = \(\) => \{/)
  assert.match(source, /setIsInvalidated\(true\)/)
  assert.match(source, /setQueue\(\[\]\)/)
  assert.match(source, /isInvalidated/)
})
