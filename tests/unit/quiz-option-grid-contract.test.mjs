import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates answer option rendering to QuizOptionGrid", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")

  assert.match(source, /from "@\/components\/quiz\/quiz-option-grid"/)
  assert.match(source, /<QuizOptionGrid\b/)
  assert.doesNotMatch(source, /currentQuestion\.options\.map/)
  assert.doesNotMatch(source, /getAnswerOptionFeedback/)
  assert.doesNotMatch(source, /getAnswerOptionClassName/)
  assert.doesNotMatch(source, /shouldShowCorrectAnswerIcon/)
  assert.doesNotMatch(source, /shouldShowWrongAnswerIcon/)
  assert.doesNotMatch(source, /CheckCircle2/)
  assert.doesNotMatch(source, /XCircle/)
})

test("QuizOptionGrid owns quiz option feedback visuals", () => {
  const source = read("src/components/quiz/quiz-option-grid.tsx")

  assert.match(source, /export function QuizOptionGrid/)
  assert.match(source, /getAnswerOptionFeedback/)
  assert.match(source, /getAnswerOptionAriaLabel/)
  assert.match(source, /getAnswerOptionClassName/)
  assert.match(source, /shouldShowCorrectAnswerIcon/)
  assert.match(source, /shouldShowWrongAnswerIcon/)
  assert.match(source, /isQuestionAnswerCorrect\(question, option\.value\)/)
  assert.match(source, /aria-label=\{getAnswerOptionAriaLabel\(String\(option\.display\), feedback\)\}/)
  assert.match(source, /aria-pressed=\{selectedOption === option\.value\}/)
  assert.match(source, /disabled=\{selectedOption != null\}/)
  assert.match(source, /data-answer-value=\{option\.value\}/)
  assert.match(source, /data-feedback=\{feedback\}/)
  assert.match(source, /testIdPrefix = "quiz-answer-option"/)
  assert.match(source, /data-testid=\{`\$\{testIdPrefix\}-\$\{index\}`\}/)
  assert.match(source, /CheckCircle2/)
  assert.match(source, /XCircle/)
})

test("QuizOptionGrid keeps wrapping heights and shrink-0 answer icons", () => {
  const source = read("src/components/quiz/quiz-option-grid.tsx")

  assert.match(source, /min-h-16/)
  assert.match(source, /h-auto/)
  assert.match(source, /whitespace-normal/)
  assert.match(source, /shrink-0/)
  assert.doesNotMatch(source, /(?<!min-)h-16/)
})
