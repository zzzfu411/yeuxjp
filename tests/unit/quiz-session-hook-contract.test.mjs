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
  assert.match(source, /const currentQuestionRef = useRef<Question \| null>\(null\)/)
  assert.match(source, /hasCurrentQuestion: Boolean\(currentQuestionRef\.current\)/)
  assert.match(source, /currentQuestionRef\.current = q/)
  assert.match(source, /currentQuestionRef\.current = null/)
  assert.match(source, /if \(shouldKeepCurrentQuizQuestionDuringPreflight\(\{[\s\S]*?\}\)\) \{\s*return/)
  assert.match(source, /setCurrentQuestion\(null\)/)
  assert.match(source, /vocabLoading/)
})

test("quiz next advances instead of keeping an answered card during vocabulary preflight", () => {
  const runner = fs.readFileSync(path.join(root, "src/components/quiz/quiz-runner.tsx"), "utf8")

  assert.match(source, /const generateQuestion = useCallback\(\(options\?: \{ advance\?: boolean \}\) => \{/)
  assert.match(source, /const advance = options\?\.advance === true/)
  assert.match(source, /advance,/)
  assert.match(source, /const advanceQuestion = useCallback\(\(\) => \{\s*generateQuestion\(\{ advance: true \}\)/)
  assert.match(source, /generateQuestion,/)
  assert.match(source, /advanceQuestion,/)
  assert.match(source, /setTimeout\(\(\) => \{\s*generateQuestion\(\)/)
  assert.doesNotMatch(source, /generateQuestion\(\{ advance: true \}\)\s*, 0\)/)
  assert.match(runner, /advanceQuestion/)
  assert.match(runner, /onClick=\{advanceQuestion\}/)
  assert.doesNotMatch(runner, /onClick=\{generateQuestion\}/)
  assert.doesNotMatch(runner, /onClick=\{\(\) => generateQuestion\(\)\}/)
})
