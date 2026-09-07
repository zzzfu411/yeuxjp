import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("presented review question hook latches the live question until the answer is cleared", () => {
  const source = read("src/components/review/use-presented-review-question.ts")

  assert.match(source, /export function usePresentedReviewQuestion/)
  assert.match(source, /presentedReviewQuestion/)
  assert.match(source, /reviewQuestionPresentationKey/)
  assert.match(source, /const \[latchedQuestion, setLatchedQuestion\] = useState<T \| null>\(live\)/)
  assert.match(source, /if \(/)
  assert.match(source, /selectedAnswer == null/)
  assert.match(source, /reviewQuestionPresentationKey\(latchedQuestion\) !== reviewQuestionPresentationKey\(live\)/)
  assert.match(source, /setLatchedQuestion\(live\)/)
  assert.match(source, /return presentedReviewQuestion\(live, selectedAnswer, latchedQuestion\)/)
  assert.doesNotMatch(source, /useRef/)
})

test("mistake and today review sessions render the latched question after an answer", () => {
  const mistakes = read("src/components/review/mistake-review-session.tsx")
  const today = read("src/components/review/today-review-session.tsx")

  assert.match(mistakes, /usePresentedReviewQuestion\(liveQuestion, selected\)/)
  assert.match(mistakes, /questionUsesTypedReview\(question\)/)
  assert.match(today, /usePresentedReviewQuestion\(data\?\.question, selected\)/)
  assert.match(today, /questionUsesTypedReview\(question\)/)
  assert.doesNotMatch(today, /questionUsesTypedReview\(data\.question\)/)
})
