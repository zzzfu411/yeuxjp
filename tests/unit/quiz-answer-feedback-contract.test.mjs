import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates answer feedback to QuizAnswerFeedback", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")

  assert.match(source, /from "@\/components\/quiz\/quiz-answer-feedback"/)
  assert.match(source, /<QuizAnswerFeedback\b/)
  assert.doesNotMatch(source, /ParticleFillFeedback/)
  assert.doesNotMatch(source, /ConjugationComparison/)
  assert.doesNotMatch(source, /isQuestionAnswerCorrect/)
  assert.doesNotMatch(source, /canShowConj/)
  assert.doesNotMatch(source, /href="\/review"/)
})

test("QuizAnswerFeedback owns particle, conjugation, explanation, and mistake prompts", () => {
  const source = read("src/components/quiz/quiz-answer-feedback.tsx")

  assert.match(source, /export function QuizAnswerFeedback/)
  assert.match(source, /ParticleFillFeedback/)
  assert.match(source, /ConjugationComparison/)
  assert.match(source, /isQuestionAnswerCorrect\(question, selectedOption\)/)
  assert.match(source, /acceptedAnswers=\{question\.acceptedAnswers\}/)
  assert.match(source, /role="status"/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /question\.explanation/)
  assert.match(source, /href="\/review"/)
  assert.match(source, /isVerbKind/)
  assert.match(source, /isVerbForm/)
})

test("special quiz feedback uses normalized answer checking", () => {
  const source = read("src/components/quiz/feedback.tsx")

  assert.match(source, /isQuestionAnswerCorrect/)
  assert.match(source, /isFeedbackAnswerCorrect/)
  assert.doesNotMatch(source, /selected === correct/)
})
