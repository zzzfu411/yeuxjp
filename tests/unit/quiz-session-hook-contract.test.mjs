import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const source = fs.readFileSync(path.join(root, "src/components/quiz/use-quiz-session.ts"), "utf8")

test("quiz session freezes answered questions across learning status updates", () => {
  assert.match(source, /shouldAutoGenerateQuizQuestion/)
  assert.match(source, /selectedOption: selectedOptionRef\.current/)
  assert.match(source, /answerPending: answerPendingRef\.current/)
  assert.match(source, /if \(!shouldAutoGenerateQuizQuestion\([\s\S]*?\)\) return/)
  assert.match(source, /selectedOptionRef\.current = submission\.selectedOption/)
})

test("quiz session keeps a visible question while vocabulary scope is only loading", () => {
  assert.match(source, /shouldKeepCurrentQuizQuestionDuringPreflight/)
  assert.match(source, /currentQuestionRef\.current = currentQuestion/)
  assert.match(source, /hasCurrentQuestion: Boolean\(currentQuestionRef\.current\)/)
  assert.match(source, /if \(shouldKeepCurrentQuizQuestionDuringPreflight\(\{[\s\S]*?\}\)\) \{\s*return/)
  assert.match(source, /setCurrentQuestion\(null\)/)
  assert.match(source, /vocabLoading/)
})
