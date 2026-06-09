import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates shared answer recording to useQuizAnswerRecorder", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")

  assert.match(source, /from "@\/components\/quiz\/use-quiz-answer-recorder"/)
  assert.match(source, /useQuizAnswerRecorder\(/)
  assert.match(source, /recordAnswer\(currentQuestion, val\)/)
  assert.match(source, /if \(!result\) return/)
  assert.match(source, /setSelectedOption\(val\)/)
  assert.doesNotMatch(source, /makeQuestionResult/)
  assert.doesNotMatch(source, /recordQuestionPractice/)
  assert.doesNotMatch(source, /recordQuizAnswer/)
})

test("useQuizAnswerRecorder owns question result, stats, and learning record writes", () => {
  const source = read("src/components/quiz/use-quiz-answer-recorder.ts")

  assert.match(source, /export function useQuizAnswerRecorder/)
  assert.match(source, /makeQuestionResult\(question, selectedAnswer\)/)
  assert.match(source, /if \(!recordQuestionPractice\(\{ progress, notebook, result \}\)\) return null/)
  assert.match(source, /setQuizStats\(\(prev\) => recordQuizAnswer\(prev, result\.correct\)\)/)
  assert.match(source, /return result/)
})
