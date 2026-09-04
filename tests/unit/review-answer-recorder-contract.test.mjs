import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

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

  assert.match(source, /makeKanaReviewQuestion\(item\.id\)/)
  assert.doesNotMatch(source, /makeKanaReviewQuestion\(item\.romaji\)/)
  assert.match(source, /makeVocabReviewQuestion\(item, vocabulary\.data, createSeededRandom\(/)
  assert.match(source, /pickVocabReviewDirection\(createSeededRandom\(/)
  assert.match(source, /getVocabReviewPromptModel\(item, direction, showRomaji\)/)
  assert.doesNotMatch(source, /makeVocabReviewQuestion\(item\.id, vocabulary\.data\)/)
  assert.doesNotMatch(source, /const question: Question =/)
  assert.doesNotMatch(source, /options: options\.map/)
  assert.doesNotMatch(source, /shuffleList/)
})

test("useReviewAnswerRecorder owns question result and learning record writes", () => {
  const source = read("src/components/review/use-review-answer-recorder.ts")
  const model = read("src/lib/review-answer-recording.ts")

  assert.match(source, /from "@\/lib\/review-answer-recording"/)
  assert.match(source, /recordReviewQuestionPractice\(\{/)
  assert.doesNotMatch(source, /makeQuestionResult/)
  assert.doesNotMatch(source, /runLearningStorageTransaction/)
  assert.doesNotMatch(source, /recordQuestionPracticeWithoutTransaction/)
  assert.match(model, /makeQuestionResult/)
  assert.match(model, /runLearningStorageTransaction/)
  assert.match(model, /recordQuestionPracticeWithoutTransaction/)
  assert.match(source, /canRecord\?: \(result: QuestionResult\) => boolean/)
  assert.match(model, /if \(canRecord && !canRecord\(result\)\) return false/)
  assert.match(model, /enrollReviewOnCorrect: false/)
  assert.match(model, /return grade\(result\)/)
  assert.doesNotMatch(source, /result\.question\.mistakeId && !result\.correct/)
  assert.match(model, /recordAnswer\(selectedAnswer, result\.correct, \(\) => \{/)
})

test("review sessions require existing SRS records before grading queued items", () => {
  const source = reviewSessionSources()
  const todayAdapter = read("src/lib/today-review-session.ts")

  assert.match(source, /canRecord: useCallback/)
  assert.equal(source.match(/srs\.has\(item\.id\)/g)?.length, 3)
  assert.doesNotMatch(source, /srs\.has\(item\.romaji\)/)
  assert.match(source, /canRecordTodayReviewItem\(current/)
  assert.equal(source.match(/srs\.gradeExisting\(item\.id/g)?.length, 3)
  assert.doesNotMatch(source, /srs\.gradeExisting\(item\.romaji/)
  assert.match(source, /gradeTodayReviewItem\(current, result/)
  assert.match(todayAdapter, /decks\[current\.deck\]\.has\(current\.id\)/)
  assert.match(todayAdapter, /decks\[current\.deck\]\.gradeExisting\(current\.id/)
  assert.match(todayAdapter, /decks\.mistakes\.gradeExisting\(current\.id, "good"\)/)
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

test("useReviewSessionState consumes the answer token before advancing the queue", async () => {
  const source = read("src/components/review/use-review-session-state.ts")
  const session = await loadTsModule("src/lib/review-session.ts")

  assert.match(source, /if \(!answerPendingRef\.current \|\| lastAnswerCorrect === null\) return/)
  assert.match(
    source,
    /if \(!answerPendingRef\.current \|\| lastAnswerCorrect === null\) return\s*answerPendingRef\.current = false\s*setQueue\(/,
  )

  // Model two synchronous activations of the callback. Only the first may consume the token.
  for (const lastAnswerCorrect of [true, false]) {
    let answerPending = true
    let queue = ["a", "b", "c"]
    const advance = () => {
      if (!answerPending || lastAnswerCorrect === null) return
      answerPending = false
      queue = session.advanceReviewQueue(queue, lastAnswerCorrect)
    }

    advance()
    advance()

    assert.deepEqual(queue, lastAnswerCorrect ? ["b", "c"] : ["b", "c", "a"])
    assert.equal(answerPending, false)
  }
})
